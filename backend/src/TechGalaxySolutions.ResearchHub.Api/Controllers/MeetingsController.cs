using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Common;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Meeting;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;

namespace TechGalaxySolutions.ResearchHub.Api.Controllers;

[ApiController]
[Route("meetings")]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly IMeetingService _meetingService;

    public MeetingsController(IMeetingService meetingService)
    {
        _meetingService = meetingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyMeetings([FromQuery] PagedRequest request)
    {
        var userId = User.GetUserId();
        var result = await _meetingService.GetMyMeetingsAsync(userId, request);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var meeting = await _meetingService.GetByIdAsync(id);
        return Ok(meeting);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMeetingRequest request)
    {
        var userId = User.GetUserId();
        var meeting = await _meetingService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(GetById), new { id = meeting.Id }, meeting);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMeetingRequest request)
    {
        var userId = User.GetUserId();
        var meeting = await _meetingService.UpdateAsync(id, userId, request);
        return Ok(meeting);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        await _meetingService.DeleteAsync(id, userId);
        return NoContent();
    }
    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
         var userId = User.GetUserId();

         var meeting = await _meetingService.CancelAsync(id, userId);

         return Ok(meeting);
    }
}
