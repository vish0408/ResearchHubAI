using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Application.DTOs.StudentProfile;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class StudentProfileService : IStudentProfileService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFileStorageService _fileStorageService;

    public StudentProfileService(
        ApplicationDbContext context,
        IMapper mapper,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _mapper = mapper;
        _fileStorageService = fileStorageService;
    }

    public async Task<StudentProfileResponse> GetProfileAsync(Guid userId)
    {
        var profile = await _context.StudentProfiles
            .Include(sp => sp.User)
            .Include(sp => sp.Guide)
            .FirstOrDefaultAsync(
                sp => sp.UserId == userId && !sp.IsDeleted);

        if (profile == null)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("User not found");

            profile = new StudentProfile
            {
                UserId = userId,
                User = user,
                Enrollment = string.Empty,
                Department = string.Empty,
                Institution = string.Empty,
            };

            _context.StudentProfiles.Add(profile);
            await _context.SaveChangesAsync();
        }

        return _mapper.Map<StudentProfileResponse>(profile);
    }

    public async Task<StudentProfileResponse> UploadProfilePictureAsync(
        Guid userId,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Profile picture is required.");

        const long maxFileSize = 5 * 1024 * 1024; // 5 MB

        if (file.Length > maxFileSize)
            throw new ArgumentException(
                "Profile picture must be less than 5 MB.");

        var allowedExtensions = new[]
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        var extension = Path
            .GetExtension(file.FileName)
            .ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
        {
            throw new ArgumentException(
                "Only JPG, JPEG, PNG and WEBP images are allowed.");
        }

        var profile = await _context.StudentProfiles
            .Include(sp => sp.User)
            .Include(sp => sp.Guide)
            .FirstOrDefaultAsync(
                sp => sp.UserId == userId && !sp.IsDeleted);

        if (profile == null)
            throw new KeyNotFoundException(
                "Student profile not found.");

        // Delete old photo if one exists
        if (!string.IsNullOrWhiteSpace(profile.ProfilePictureUrl))
        {
            await _fileStorageService.DeleteFileAsync(
                profile.ProfilePictureUrl);
        }

        // Save new photo
        var relativePath = await _fileStorageService.SaveFileAsync(
            file,
            "profile-pictures");

        profile.ProfilePictureUrl = relativePath;

        await _context.SaveChangesAsync();

        return _mapper.Map<StudentProfileResponse>(profile);
    }

    public async Task<StudentProfileResponse> UpdateProfileAsync(
    Guid userId,
    UpdateStudentProfileRequest request)
{
    var profile = await _context.StudentProfiles
        .Include(sp => sp.User)
        .Include(sp => sp.Guide)
        .FirstOrDefaultAsync(
            sp => sp.UserId == userId && !sp.IsDeleted);

    if (profile == null)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found");

        profile = new StudentProfile
        {
            UserId = userId,
            User = user,
        };

        _context.StudentProfiles.Add(profile);
    }

    // ==============================
    // USER INFORMATION
    // ==============================
    profile.User.FullName = request.FullName;
    profile.User.Email = request.Email;

    // ==============================
    // STUDENT PROFILE INFORMATION
    // ==============================
    profile.Enrollment = request.Enrollment;
    profile.Department = request.Department;
    profile.Institution = request.Institution;
    profile.ResearchTopic = request.ResearchTopic;

    // Do NOT update GuideId here.
    // Guide assignment is managed separately.

    await _context.SaveChangesAsync();

    return _mapper.Map<StudentProfileResponse>(profile);
}
}