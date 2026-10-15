using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;

namespace TechGalaxySolutions.ResearchHub.Domain.Entities;

public class StudentCourseworkSubmission : BaseEntity
{
    // Student
    public Guid StudentProfileId { get; set; }

    public StudentProfile StudentProfile { get; set; } = null!;

    // Course Details
    public string CourseName { get; set; } = string.Empty;

    public string? CourseCode { get; set; }

    public string CourseType { get; set; } = string.Empty;

    public int Credits { get; set; }

    public string? Institution { get; set; }

    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime CompletionDate { get; set; }

    // Certificate
    public string CertificateFileName { get; set; } = string.Empty;

    public string CertificateFileType { get; set; } = string.Empty;

    public long CertificateFileSize { get; set; }

    public string CertificateStoredFilePath { get; set; } = string.Empty;

    // Review
    public ReviewStatus Status { get; set; } = ReviewStatus.Pending;

    public string? GuideFeedback { get; set; }

    public Guid? ReviewedBy { get; set; }

    public User? Reviewer { get; set; }

    public DateTime? ReviewedAt { get; set; }
}