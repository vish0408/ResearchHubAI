using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechGalaxySolutions.ResearchHub.Application.DTOs.ChapterComment;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;

namespace TechGalaxySolutions.ResearchHub.Api.Controllers;

[ApiController]
[Route("chapters/{chapterId:guid}/comments")]
[Authorize]
public class ChapterCommentsController : ControllerBase
{
    private readonly IChapterCommentService _commentService;

    public ChapterCommentsController(
        IChapterCommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetComments(Guid chapterId)
    {
        var comments =
            await _commentService.GetChapterCommentsAsync(chapterId);

        return Ok(comments);
    }

    [HttpPost]
    public async Task<IActionResult> AddComment(
        Guid chapterId,
        [FromBody] AddChapterCommentRequest request)
    {
        var userId = User.GetUserId();

        var comment =
            await _commentService.AddCommentAsync(
                chapterId,
                userId,
                request);

        return CreatedAtAction(
            nameof(GetComments),
            new { chapterId },
            comment);
    }

    [HttpPatch("thread/{threadId:guid}/read")]
public async Task<IActionResult> MarkThreadAsRead(
    Guid chapterId,
    Guid threadId)
{
    var userId = User.GetUserId();

    await _commentService.MarkThreadAsReadAsync(
        chapterId,
        threadId,
        userId);

    return NoContent();
}

    [HttpPatch("{id:guid}/resolve")]
    public async Task<IActionResult> ResolveComment(
        Guid chapterId,
        Guid id)
    {
        var userId = User.GetUserId();

        var comment =
            await _commentService.ResolveCommentAsync(
                id,
                userId);

        return Ok(comment);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteComment(
        Guid chapterId,
        Guid id)
    {
        var userId = User.GetUserId();

        await _commentService.DeleteCommentAsync(
            id,
            userId);

        return NoContent();
    }
}