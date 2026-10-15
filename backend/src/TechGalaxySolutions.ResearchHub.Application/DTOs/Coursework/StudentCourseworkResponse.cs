namespace TechGalaxySolutions.ResearchHub.Application.DTOs.Coursework;

public class StudentCourseworkResponse
{
    public Guid Id { get; set; }

    public Guid StudentProfileId { get; set; }

    public string CourseName { get; set; } = string.Empty;

    public string? CourseCode { get; set; }

    public string CourseType { get; set; } = string.Empty;

    public int Credits { get; set; }

    public string? Institution { get; set; }

    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime CompletionDate { get; set; }

    public string CertificateFileName { get; set; } = string.Empty;

    public string CertificateFileType { get; set; } = string.Empty;

    public long CertificateFileSize { get; set; }

    public string Status { get; set; } = "Pending";

    public string? GuideFeedback { get; set; }

    public Guid? ReviewedBy { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}