using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechGalaxySolutions.ResearchHub.Application.DTOs.StudentProfile;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;

namespace TechGalaxySolutions.ResearchHub.Api.Controllers;

[ApiController]
[Route("student/profile")]
[Authorize(Roles = "Student")]
public class StudentProfileController : ControllerBase
{
    private readonly IStudentProfileService _studentProfileService;

    public StudentProfileController(IStudentProfileService studentProfileService)
    {
        _studentProfileService = studentProfileService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.GetUserId();
        var profile = await _studentProfileService.GetProfileAsync(userId);
        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateStudentProfileRequest request)
    {
        var userId = User.GetUserId();
        var profile = await _studentProfileService.UpdateProfileAsync(userId, request);
        return Ok(profile);
    }

    [HttpPost("photo")]
[Consumes("multipart/form-data")]
public async Task<IActionResult> UploadProfilePicture(
    IFormFile file)
{
    var userId = User.GetUserId();

    var profile =
        await _studentProfileService.UploadProfilePictureAsync(
            userId,
            file);

    return Ok(profile);
}   
}
