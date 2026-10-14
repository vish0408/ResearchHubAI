// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using TechGalaxySolutions.ResearchHub.Application.DTOs.Coursework;
// using TechGalaxySolutions.ResearchHub.Application.Interfaces;

// namespace TechGalaxySolutions.ResearchHub.Api.Controllers;

// [ApiController]
// [Route("students/{studentUserId:guid}/coursework")]
// [Authorize(Roles = "SuperAdmin,CollegeAdmin,HOD,Guide,Student")]
// public class ScholarCourseworkController : ControllerBase
// {
//     private readonly IScholarCourseworkService _courseworkService;

//     public ScholarCourseworkController(IScholarCourseworkService courseworkService)
//     {
//         _courseworkService = courseworkService;
//     }

//     private Guid GetCurrentUserId()
//     {
//         var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
//         return claim != null && Guid.TryParse(claim, out var id) ? id : Guid.Empty;
//     }

//     private string GetCurrentRole()
//     {
//         return User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
//     }

//     private Guid? GetCollegeId()
//     {
//         var claim = User.FindFirst("CollegeId")?.Value;
//         return !string.IsNullOrEmpty(claim) && Guid.TryParse(claim, out var cid) ? cid : null;
//     }

//     [HttpGet]
//     public async Task<IActionResult> GetCoursework(Guid studentUserId)
//     {
//         var result = await _courseworkService.GetCourseworkAsync(studentUserId, GetCurrentUserId(), GetCurrentRole(), GetCollegeId());
//         return Ok(result);
//     }

//     [HttpGet("summary")]
//     public async Task<IActionResult> GetSummary(Guid studentUserId)
//     {
//         var result = await _courseworkService.GetSummaryAsync(studentUserId, GetCurrentUserId(), GetCurrentRole(), GetCollegeId());
//         return Ok(result);
//     }

//     [HttpGet("{courseworkId:guid}")]
//     public async Task<IActionResult> GetById(Guid studentUserId, Guid courseworkId)
//     {
//         var result = await _courseworkService.GetCourseworkItemAsync(studentUserId, courseworkId, GetCurrentUserId(), GetCurrentRole(), GetCollegeId());
//         return Ok(result);
//     }

//     [HttpPost]
//     public async Task<IActionResult> Create(Guid studentUserId, [FromBody] CreateCourseworkRequest request)
//     {
//         var result = await _courseworkService.CreateAsync(studentUserId, request, GetCurrentUserId(), GetCurrentRole(), GetCollegeId());
//         return Created(string.Empty, result);
//     }

//     [HttpPut("{courseworkId:guid}")]
//     public async Task<IActionResult> Update(Guid studentUserId, Guid courseworkId, [FromBody] UpdateCourseworkRequest request)
//     {
//         var result = await _courseworkService.UpdateAsync(studentUserId, courseworkId, request, GetCurrentUserId(), GetCurrentRole(), GetCollegeId());
//         return Ok(result);
//     }

//     [HttpDelete("{courseworkId:guid}")]
//     public async Task<IActionResult> Delete(Guid studentUserId, Guid courseworkId)
//     {
//         await _courseworkService.DeleteAsync(studentUserId, courseworkId, GetCurrentUserId(), GetCurrentRole(), GetCollegeId());
//         return Ok(new { message = "Coursework deleted successfully." });
//     }
// }

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Coursework;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;

namespace TechGalaxySolutions.ResearchHub.Api.Controllers;

[ApiController]
[Route("student-coursework")]
[Authorize(Roles = "Guide,Student")]
public class StudentCourseworkController : ControllerBase
{
    private readonly IStudentCourseworkService _courseworkService;

    public StudentCourseworkController(
        IStudentCourseworkService courseworkService)
    {
        _courseworkService = courseworkService;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier
        )?.Value;

        return claim != null &&
               Guid.TryParse(claim, out var id)
            ? id
            : Guid.Empty;
    }

    // Student: Get my coursework submissions
    [HttpGet]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyCoursework()
    {
        var userId = GetCurrentUserId();

        var result =
            await _courseworkService.GetMyCourseworkAsync(
                userId);

        return Ok(result);
    }


// Guide: Get pending coursework from assigned students
[HttpGet("guide/pending")]
[Authorize(Roles = "Guide")]
public async Task<IActionResult> GetPendingForGuide()
{
    var guideUserId = GetCurrentUserId();

    var result =
        await _courseworkService.GetPendingForGuideAsync(
            guideUserId);

    return Ok(result);
}



    // Guide: Get all coursework submissions from assigned students
    [HttpGet("guide/all")]
    [Authorize(Roles = "Guide")]
    public async Task<IActionResult> GetAllForGuide()
    {
        var guideUserId = GetCurrentUserId();

        var result =
            await _courseworkService.GetAllForGuideAsync(guideUserId);

        return Ok(result);
    }


    // Student: Submit new coursework
    [HttpPost]
    [Authorize(Roles = "Student")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Create(
        [FromForm] CreateStudentCourseworkRequest request)
    {
        var userId = GetCurrentUserId();

        var result =
            await _courseworkService.CreateAsync(
                userId,
                request);

        return Created(string.Empty, result);
    }

    // Student: Update rejected coursework and resubmit
    [HttpPut("{courseworkId:guid}")]
    [Authorize(Roles = "Student")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Update(
        Guid courseworkId,
        [FromForm] UpdateStudentCourseworkRequest request)
    {
        var userId = GetCurrentUserId();

        var result =
            await _courseworkService.UpdateAsync(
                userId,
                courseworkId,
                request);

        return Ok(result);
    }

    // Student: Delete coursework
    [HttpDelete("{courseworkId:guid}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Delete(
        Guid courseworkId)
    {
        var userId = GetCurrentUserId();

        await _courseworkService.DeleteAsync(
            userId,
            courseworkId);

        return Ok(new
        {
            message = "Coursework deleted successfully."
        });
    }

    // Student: Download certificate
    [HttpGet("{courseworkId:guid}/certificate")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> DownloadCertificate(
        Guid courseworkId)
    {
        var userId = GetCurrentUserId();

        var result =
            await _courseworkService
                .DownloadCertificateAsync(
                    userId,
                    courseworkId);

        if (result == null)
        {
            return NotFound(
                new
                {
                    message = "Certificate not found."
                });
        }

        return File(
            result.Data,
            result.ContentType,
            result.FileName);
    }



    
    // Guide: Download certificate from an assigned student's submission
    [HttpGet("guide/{courseworkId:guid}/certificate")]
    [Authorize(Roles = "Guide")]
    public async Task<IActionResult> DownloadCertificateForGuide(
        Guid courseworkId)
    {
        var guideUserId = GetCurrentUserId();

        var result =
            await _courseworkService.DownloadCertificateForGuideAsync(
                guideUserId,
                courseworkId);

        if (result == null)
        {
            return NotFound(new
            {
                message = "Certificate not found."
            });
        }

        return File(
            result.Data,
            result.ContentType,
            result.FileName);
    }



    // Guide: Approve / Reject coursework
    [HttpPatch("{courseworkId:guid}/review")]
    [Authorize(Roles = "Guide")]
    public async Task<IActionResult> Review(
        Guid courseworkId,
        [FromBody] ReviewStudentCourseworkRequest request)
    {
        var guideUserId = GetCurrentUserId();

        var result =
            await _courseworkService.ReviewAsync(
                guideUserId,
                courseworkId,
                request);

        return Ok(result);
    }
}