using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Chapter;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;

namespace TechGalaxySolutions.ResearchHub.Api.Controllers;

[ApiController]
[Route("projects/{projectId:guid}/chapters")]
[Authorize]
public class ChaptersController : ControllerBase
{
    private readonly IChapterService _chapterService;

    public ChaptersController(IChapterService chapterService)
    {
        _chapterService = chapterService;
    }

    [HttpGet]
    public async Task<IActionResult> GetChapters(Guid projectId)
    {
        var chapters = await _chapterService.GetProjectChaptersAsync(projectId);
        return Ok(chapters);
    }

    [HttpGet("{id:guid}/versions/{versionId:guid}/download")]
public async Task<IActionResult> DownloadVersion(
    Guid projectId,
    Guid id,
    Guid versionId)
{
    var userId = User.GetUserId();

    var result = await _chapterService.DownloadVersionAsync(
        id,
        versionId,
        userId);

    return File(
        result.Data,
        result.ContentType,
        result.FileName);
}

    [HttpPost]
public async Task<IActionResult> Create(
    Guid projectId,
    [FromForm] CreateChapterRequest request)
{
    var userId = User.GetUserId();

    var chapter = await _chapterService.CreateAsync(
        projectId,
        userId,
        request);

    return Ok(chapter);
}

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid projectId, Guid id)
    {
        var chapter = await _chapterService.GetByIdAsync(id);
        return Ok(chapter);
    }

    // GET: /projects/{projectId}/chapters/{id}/versions
    [HttpGet("{id:guid}/versions")]
    public async Task<IActionResult> GetVersions(Guid projectId, Guid id)
    {
        var versions = await _chapterService.GetVersionsAsync(id);
        return Ok(versions);
    }

    [HttpPost("{id:guid}/versions")]
public async Task<IActionResult> CreateVersion(
    Guid projectId,
    Guid id,
    [FromForm] CreateChapterVersionRequest request)
{
    var userId = User.GetUserId();

    var version = await _chapterService.CreateVersionAsync(
        id,
        userId,
        request);

    return Ok(version);
}

[HttpPost("{id:guid}/submit")]
public async Task<IActionResult> Submit(
    Guid projectId,
    Guid id)
{
    var userId = User.GetUserId();

    var chapter = await _chapterService.SubmitAsync(
        id,
        userId);

    return Ok(chapter);
}



    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid projectId,
        Guid id,
        [FromBody] UpdateChapterStatusRequest request)
    {
        var userId = User.GetUserId();

        var chapter = await _chapterService.UpdateStatusAsync(
            id,
            userId,
            request);

        return Ok(chapter);
    }
}