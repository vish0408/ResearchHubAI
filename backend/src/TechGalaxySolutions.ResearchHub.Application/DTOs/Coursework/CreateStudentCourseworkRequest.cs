using Microsoft.AspNetCore.Http;

namespace TechGalaxySolutions.ResearchHub.Application.DTOs.Coursework;

public class CreateStudentCourseworkRequest
{
    public string CourseName { get; set; } = string.Empty;

    public string? CourseCode { get; set; }

    public string CourseType { get; set; } = string.Empty;

    public int Credits { get; set; }

    public string? Institution { get; set; }

    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime CompletionDate { get; set; }

    public IFormFile Certificate { get; set; } = null!;
}