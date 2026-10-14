namespace TechGalaxySolutions.ResearchHub.Application.DTOs.Coursework;

public class ReviewStudentCourseworkRequest
{
    public string Status { get; set; } = string.Empty;

    public string? Feedback { get; set; }
}