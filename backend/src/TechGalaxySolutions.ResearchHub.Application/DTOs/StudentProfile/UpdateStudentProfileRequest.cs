namespace TechGalaxySolutions.ResearchHub.Application.DTOs.StudentProfile;

public class UpdateStudentProfileRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Enrollment { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string Institution { get; set; } = string.Empty;

    public string? ResearchTopic { get; set; }
}