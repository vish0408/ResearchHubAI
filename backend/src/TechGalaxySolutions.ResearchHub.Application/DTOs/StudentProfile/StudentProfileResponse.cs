namespace TechGalaxySolutions.ResearchHub.Application.DTOs.StudentProfile;

public class StudentProfileResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Enrollment { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string? ResearchTopic { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public Guid? GuideId { get; set; }
    public string? GuideName { get; set; }
}
