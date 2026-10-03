namespace TechGalaxySolutions.ResearchHub.Application.DTOs.Auth;

public class CurrentUserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsFirstLogin { get; set; }
    public bool EmailVerified { get; set; }
    public string? PhoneNumber { get; set; }
    public string? EmployeeId { get; set; }
    public string? CollegeId { get; set; }
    public string? DepartmentId { get; set; }
    public string? CollegeName { get; set; }
    public string? DepartmentName { get; set; }
    public string? ProfilePictureUrl { get; set; }
}
