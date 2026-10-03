using TechGalaxySolutions.ResearchHub.Application.DTOs.StudentProfile;

using Microsoft.AspNetCore.Http;

namespace TechGalaxySolutions.ResearchHub.Application.Interfaces;

public interface IStudentProfileService
{
    Task<StudentProfileResponse> GetProfileAsync(Guid userId);
    Task<StudentProfileResponse> UpdateProfileAsync(Guid userId, UpdateStudentProfileRequest request);
    Task<StudentProfileResponse> UploadProfilePictureAsync(
    Guid userId,
    IFormFile file);
}
