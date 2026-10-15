using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Coursework;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class StudentCourseworkService : IStudentCourseworkService
{
    private readonly ApplicationDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private readonly IAuditLogService _auditLogService;

    public StudentCourseworkService(
        ApplicationDbContext context,
        IFileStorageService fileStorage,
        IAuditLogService auditLogService)
    {
        _context = context;
        _fileStorage = fileStorage;
        _auditLogService = auditLogService;
    }

    public async Task<List<StudentCourseworkResponse>> GetMyCourseworkAsync(
        Guid userId)
    {
        var profile = await GetStudentProfileAsync(userId);

        var items = await _context.Set<StudentCourseworkSubmission>()
            .AsNoTracking()
            .Where(c =>
                c.StudentProfileId == profile.Id &&
                !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return items.Select(MapToResponse).ToList();
    }


    public async Task<List<StudentCourseworkResponse>> GetPendingForGuideAsync(
    Guid guideUserId)
{
    var items = await _context
        .Set<StudentCourseworkSubmission>()
        .AsNoTracking()
        .Include(c => c.StudentProfile)
        .Where(c =>
            !c.IsDeleted &&
            c.StudentProfile.GuideId == guideUserId &&
            c.Status == ReviewStatus.Pending)
        .OrderByDescending(c => c.CreatedAt)
        .ToListAsync();

    return items.Select(MapToResponse).ToList();
}



public async Task<List<StudentCourseworkResponse>> GetAllForGuideAsync(
    Guid guideUserId)
{
    var items = await _context
        .Set<StudentCourseworkSubmission>()
        .AsNoTracking()
        .Include(c => c.StudentProfile)
        .Where(c =>
            !c.IsDeleted &&
            c.StudentProfile.GuideId == guideUserId)
        .OrderByDescending(c => c.CreatedAt)
        .ToListAsync();

    return items.Select(MapToResponse).ToList();
}



    public async Task<StudentCourseworkResponse> CreateAsync(
        Guid userId,
        CreateStudentCourseworkRequest request)
    {
        var profile = await GetStudentProfileAsync(userId);

        ValidateCoursework(request.CourseName, request.CourseType, request.Credits);

        if (request.Certificate == null || request.Certificate.Length == 0)
            throw new InvalidOperationException(
                "Course certificate is required.");

        ValidateCertificate(request.Certificate);

        var storedPath = await _fileStorage.SaveFileAsync(
            request.Certificate,
            "coursework");

        var coursework = new StudentCourseworkSubmission
        {
            StudentProfileId = profile.Id,

            CourseName = request.CourseName.Trim(),
            CourseCode = request.CourseCode?.Trim(),
            CourseType = request.CourseType.Trim(),
            Credits = request.Credits,
            Institution = request.Institution?.Trim(),
            Description = request.Description?.Trim(),
            StartDate = request.StartDate,
            CompletionDate = request.CompletionDate,

            CertificateFileName = request.Certificate.FileName,
            CertificateFileType = Path
                .GetExtension(request.Certificate.FileName)
                .TrimStart('.')
                .ToLowerInvariant(),
            CertificateFileSize = request.Certificate.Length,
            CertificateStoredFilePath = storedPath,

            Status = ReviewStatus.Pending,
            GuideFeedback = null,
            ReviewedBy = null,
            ReviewedAt = null,
        };

        _context.Set<StudentCourseworkSubmission>().Add(coursework);

        await _context.SaveChangesAsync();

        await NotifyGuideAsync(
            profile.GuideId,
            profile.UserId,
            coursework.CourseName,
            "submitted");

        await _auditLogService.LogAsync(
            userId,
            "StudentCoursework_Submitted",
            "StudentCourseworkSubmission",
            coursework.Id.ToString(),
            null,
            $"CourseName={coursework.CourseName}");

        return MapToResponse(coursework);
    }

    public async Task<StudentCourseworkResponse> UpdateAsync(
        Guid userId,
        Guid courseworkId,
        UpdateStudentCourseworkRequest request)
    {
        var profile = await GetStudentProfileAsync(userId);

        var coursework = await _context.Set<StudentCourseworkSubmission>()
            .FirstOrDefaultAsync(c =>
                c.Id == courseworkId &&
                c.StudentProfileId == profile.Id &&
                !c.IsDeleted)
            ?? throw new KeyNotFoundException(
                "Coursework submission not found.");

        if (coursework.Status != ReviewStatus.Rejected)
        {
            throw new InvalidOperationException(
                "Only rejected coursework can be updated.");
        }

        ValidateCoursework(
            request.CourseName,
            request.CourseType,
            request.Credits);

        coursework.CourseName = request.CourseName.Trim();
        coursework.CourseCode = request.CourseCode?.Trim();
        coursework.CourseType = request.CourseType.Trim();
        coursework.Credits = request.Credits;
        coursework.Institution = request.Institution?.Trim();
        coursework.Description = request.Description?.Trim();
        coursework.StartDate = request.StartDate;
        coursework.CompletionDate = request.CompletionDate;

        if (request.Certificate != null &&
            request.Certificate.Length > 0)
        {
            ValidateCertificate(request.Certificate);

            if (!string.IsNullOrWhiteSpace(
                    coursework.CertificateStoredFilePath))
            {
                await _fileStorage.DeleteFileAsync(
                    coursework.CertificateStoredFilePath);
            }

            coursework.CertificateStoredFilePath =
                await _fileStorage.SaveFileAsync(
                    request.Certificate,
                    "coursework");

            coursework.CertificateFileName =
                request.Certificate.FileName;

            coursework.CertificateFileType =
                Path.GetExtension(request.Certificate.FileName)
                    .TrimStart('.')
                    .ToLowerInvariant();

            coursework.CertificateFileSize =
                request.Certificate.Length;
        }

        // Resubmission
        coursework.Status = ReviewStatus.Pending;
        coursework.GuideFeedback = null;
        coursework.ReviewedBy = null;
        coursework.ReviewedAt = null;
        coursework.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await NotifyGuideAsync(
            profile.GuideId,
            profile.UserId,
            coursework.CourseName,
            "resubmitted");

        await _auditLogService.LogAsync(
            userId,
            "StudentCoursework_Resubmitted",
            "StudentCourseworkSubmission",
            coursework.Id.ToString(),
            null,
            $"CourseName={coursework.CourseName}");

        return MapToResponse(coursework);
    }

    public async Task DeleteAsync(
        Guid userId,
        Guid courseworkId)
    {
        var profile = await GetStudentProfileAsync(userId);

        var coursework = await _context.Set<StudentCourseworkSubmission>()
            .FirstOrDefaultAsync(c =>
                c.Id == courseworkId &&
                c.StudentProfileId == profile.Id &&
                !c.IsDeleted)
            ?? throw new KeyNotFoundException(
                "Coursework submission not found.");

        if (coursework.Status == ReviewStatus.Approved)
        {
            throw new InvalidOperationException(
                "Approved coursework cannot be deleted.");
        }

        coursework.IsDeleted = true;
        coursework.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(
                coursework.CertificateStoredFilePath))
        {
            await _fileStorage.DeleteFileAsync(
                coursework.CertificateStoredFilePath);
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId,
            "StudentCoursework_Deleted",
            "StudentCourseworkSubmission",
            coursework.Id.ToString(),
            null,
            $"CourseName={coursework.CourseName}");
    }

    public async Task<StudentCourseworkResponse> ReviewAsync(
        Guid guideUserId,
        Guid courseworkId,
        ReviewStudentCourseworkRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Status))
        {
            throw new InvalidOperationException(
                "Review status is required.");
        }

        if (!Enum.TryParse<ReviewStatus>(
                request.Status,
                true,
                out var status))
        {
            throw new InvalidOperationException(
                "Invalid review status.");
        }

        if (status != ReviewStatus.Approved &&
            status != ReviewStatus.Rejected)
        {
            throw new InvalidOperationException(
                "Guide can only approve or reject coursework.");
        }

        var coursework = await _context
            .Set<StudentCourseworkSubmission>()
            .Include(c => c.StudentProfile)
            .FirstOrDefaultAsync(c =>
                c.Id == courseworkId &&
                !c.IsDeleted)
            ?? throw new KeyNotFoundException(
                "Coursework submission not found.");

        var guideProfile = coursework.StudentProfile;

        if (guideProfile.GuideId != guideUserId)
        {
            throw new UnauthorizedAccessException(
                "You are not authorized to review this coursework.");
        }

        if (coursework.Status == ReviewStatus.Approved)
        {
            throw new InvalidOperationException(
                "This coursework has already been approved.");
        }

        if (status == ReviewStatus.Rejected &&
            string.IsNullOrWhiteSpace(request.Feedback))
        {
            throw new InvalidOperationException(
                "Feedback is required when rejecting coursework.");
        }

        coursework.Status = status;
        coursework.GuideFeedback =
            status == ReviewStatus.Rejected
                ? request.Feedback?.Trim()
                : null;

        coursework.ReviewedBy = guideUserId;
        coursework.ReviewedAt = DateTime.UtcNow;
        coursework.UpdatedAt = DateTime.UtcNow;

        var studentUserId = coursework.StudentProfile.UserId;

        var notification = new Notification
        {
            UserId = studentUserId,
            Title = status == ReviewStatus.Approved
                ? "Coursework Approved"
                : "Coursework Rejected",
            Message = status == ReviewStatus.Approved
                ? $"Your coursework '{coursework.CourseName}' has been approved by your guide."
                : $"Your coursework '{coursework.CourseName}' has been rejected. Feedback: {coursework.GuideFeedback}",
            Type = status == ReviewStatus.Approved
                ? "success"
                : "error",
        };

        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            guideUserId,
            $"StudentCoursework_{status}",
            "StudentCourseworkSubmission",
            coursework.Id.ToString(),
            null,
            $"CourseName={coursework.CourseName}, Feedback={coursework.GuideFeedback}");

        return MapToResponse(coursework);
    }

    public async Task<FileDownloadResult?> DownloadCertificateAsync(
        Guid userId,
        Guid courseworkId)
    {
        var profile = await GetStudentProfileAsync(userId);

        var coursework = await _context
            .Set<StudentCourseworkSubmission>()
            .AsNoTracking()
            .FirstOrDefaultAsync(c =>
                c.Id == courseworkId &&
                c.StudentProfileId == profile.Id &&
                !c.IsDeleted);

        if (coursework == null)
            return null;

        if (string.IsNullOrWhiteSpace(
                coursework.CertificateStoredFilePath))
        {
            return null;
        }

        var data = await _fileStorage.ReadFileAsync(
            coursework.CertificateStoredFilePath);

        if (data == null || data.Length == 0)
            return null;

        return new FileDownloadResult
        {
            Data = data,
            ContentType = _fileStorage.GetContentType(
                coursework.CertificateFileName),
            FileName = coursework.CertificateFileName,
        };
    }



   
public async Task<FileDownloadResult?> DownloadCertificateForGuideAsync(
    Guid guideUserId,
    Guid courseworkId)
{
    var coursework = await _context
        .Set<StudentCourseworkSubmission>()
        .AsNoTracking()
        .Include(c => c.StudentProfile)
        .FirstOrDefaultAsync(c =>
            c.Id == courseworkId &&
            !c.IsDeleted);

    if (coursework == null)
        return null;

    // Only the student's currently assigned guide can access it.
    if (coursework.StudentProfile.GuideId != guideUserId)
    {
        throw new UnauthorizedAccessException(
            "You are not authorized to access this certificate.");
    }

    if (string.IsNullOrWhiteSpace(
        coursework.CertificateStoredFilePath))
    {
        return null;
    }

    var data = await _fileStorage.ReadFileAsync(
        coursework.CertificateStoredFilePath);

    if (data == null || data.Length == 0)
        return null;

    return new FileDownloadResult
    {
        Data = data,
        ContentType = _fileStorage.GetContentType(
            coursework.CertificateFileName),
        FileName = coursework.CertificateFileName,
    };
}



    private async Task<StudentProfile> GetStudentProfileAsync(
        Guid userId)
    {
        return await _context.Set<StudentProfile>()
            .FirstOrDefaultAsync(s =>
                s.UserId == userId &&
                !s.IsDeleted)
            ?? throw new KeyNotFoundException(
                "Student profile not found.");
    }

    private static void ValidateCoursework(
        string courseName,
        string courseType,
        int credits)
    {
        if (string.IsNullOrWhiteSpace(courseName))
            throw new InvalidOperationException(
                "Course name is required.");

        if (string.IsNullOrWhiteSpace(courseType))
            throw new InvalidOperationException(
                "Course type is required.");

        if (credits <= 0)
            throw new InvalidOperationException(
                "Credits must be greater than zero.");
    }

    private static void ValidateCertificate(
        IFormFile certificate)
    {
        var extension = Path
            .GetExtension(certificate.FileName)
            .ToLowerInvariant();

        var allowedExtensions = new[]
        {
            ".pdf",
            ".jpg",
            ".jpeg",
            ".png"
        };

        if (!allowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException(
                "Only PDF, JPG, JPEG, and PNG certificates are allowed.");
        }

        const long maxSize = 10 * 1024 * 1024;

        if (certificate.Length > maxSize)
        {
            throw new InvalidOperationException(
                "Certificate file size cannot exceed 10 MB.");
        }
    }

    private async Task NotifyGuideAsync(
        Guid? guideId,
        Guid studentUserId,
        string courseName,
        string action)
    {
        if (!guideId.HasValue)
            return;

        var student = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                u.Id == studentUserId);

        var studentName = student?.FullName ?? "Student";

        _context.Notifications.Add(new Notification
        {
            UserId = guideId.Value,
            Title = "Coursework Submitted",
            Message = $"{studentName} {action} coursework '{courseName}' for your review.",
            Type = "info",
        });

        await _context.SaveChangesAsync();
    }

    private static StudentCourseworkResponse MapToResponse(
        StudentCourseworkSubmission coursework)
    {
        return new StudentCourseworkResponse
        {
            Id = coursework.Id,
            StudentProfileId = coursework.StudentProfileId,

            CourseName = coursework.CourseName,
            CourseCode = coursework.CourseCode,
            CourseType = coursework.CourseType,
            Credits = coursework.Credits,
            Institution = coursework.Institution,
            Description = coursework.Description,
            StartDate = coursework.StartDate,
            CompletionDate = coursework.CompletionDate,

            CertificateFileName =
                coursework.CertificateFileName,

            CertificateFileType =
                coursework.CertificateFileType,

            CertificateFileSize =
                coursework.CertificateFileSize,

            Status = coursework.Status.ToString(),

            GuideFeedback =
                coursework.GuideFeedback,

            ReviewedBy =
                coursework.ReviewedBy,

            ReviewedAt =
                coursework.ReviewedAt,

            CreatedAt =
                coursework.CreatedAt,

            UpdatedAt =
                coursework.UpdatedAt,
        };
    }
}