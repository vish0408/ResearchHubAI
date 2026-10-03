using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechGalaxySolutions.ResearchHub.Api.Extensions;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Literature;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;

namespace TechGalaxySolutions.ResearchHub.Api.Controllers;

[ApiController]
[Route("literature")]
[Authorize(Roles = "Student")]
public class LiteratureReviewController : ControllerBase
{
    private readonly ILiteratureReviewService _literatureService;

    public LiteratureReviewController(ILiteratureReviewService literatureService)
    {
        _literatureService = literatureService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromBody] UploadDocumentRequest request)
    {
        var userId = User.GetUserId();
        var result = await _literatureService.UploadDocumentAsync(userId, request);
        return Ok(result);
    }


    [HttpPost("analyze-review")]
public async Task<IActionResult> AnalyzeReview(
    [FromBody] AnalyzeLiteratureReviewRequest request)
{
    var userId = User.GetUserId();

    var result = await _literatureService
        .AnalyzeLiteratureReviewAsync(userId, request);

    return Ok(result);
}

    [HttpPost("analyze")]
    public async Task<IActionResult> Analyze([FromBody] AnalyzeDocumentRequest request)
    {
        var userId = User.GetUserId();
        var result = await _literatureService.AnalyzeDocumentAsync(userId, request);
        return Ok(result);
    }

    [HttpPost("summarize")]
    public async Task<IActionResult> Summarize([FromBody] SummarizeRequest request)
    {
        var userId = User.GetUserId();
        var result = await _literatureService.SummarizeDocumentAsync(userId, request);
        return Ok(result);
    }

    [HttpPost("compare")]
    public async Task<IActionResult> Compare([FromBody] CompareRequest request)
    {
        var userId = User.GetUserId();
        var result = await _literatureService.CompareDocumentsAsync(userId, request);
        return Ok(result);
    }

    [HttpPost("research-gaps")]
    public async Task<IActionResult> ResearchGaps([FromBody] ResearchGapsRequest request)
    {
        var userId = User.GetUserId();
        var result = await _literatureService.FindResearchGapsAsync(userId, request);
        return Ok(result);
    }

    [HttpPost("extract-keywords")]
    public async Task<IActionResult> ExtractKeywords([FromBody] ExtractKeywordsRequest request)
    {
        var userId = User.GetUserId();
        var result = await _literatureService.ExtractKeywordsAsync(userId, request);
        return Ok(result);
    }

    [HttpPost("generate-related-work")]
    public async Task<IActionResult> GenerateRelatedWork([FromBody] GenerateRelatedWorkRequest request)
    {
        var userId = User.GetUserId();
        var result = await _literatureService.GenerateRelatedWorkAsync(userId, request);
        return Ok(result);
    }

    // [HttpGet("history")]
    // public async Task<IActionResult> GetHistory()
    // {
    //     var userId = User.GetUserId();
    //     var result = await _literatureService.GetHistoryAsync(userId);
    //     return Ok(result);
    // }


     [HttpGet("history")]
public async Task<IActionResult> GetHistory()
{
    var userId = User.GetUserId();

    Console.WriteLine($"[Literature History] UserId: {userId}");

    var result = await _literatureService.GetHistoryAsync(userId);

    Console.WriteLine($"[Literature History] Count: {result.Count}");

    return Ok(result);
}


    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = User.GetUserId();
        var result = await _literatureService.GetByIdAsync(id, userId);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        await _literatureService.DeleteAsync(id, userId);
        return NoContent();
    }
}
