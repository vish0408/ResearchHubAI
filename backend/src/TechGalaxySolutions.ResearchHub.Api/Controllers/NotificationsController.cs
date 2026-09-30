using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Common;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Notification;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;

namespace TechGalaxySolutions.ResearchHub.Api.Controllers;

[ApiController]
[Route("notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] PagedRequest request)
    {
        var userId = User.GetUserId();
        var result = await _notificationService.GetMyNotificationsAsync(userId, request);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = User.GetUserId();
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateNotificationRequest request)
    {
        var userId = User.GetUserId();
        var notification = await _notificationService.CreateNotificationAsync(userId, request.Title, request.Message, request.Type);
        return Ok(notification);
    }

    [HttpPost("send")]
[Authorize(Roles = "Guide")]
public async Task<IActionResult> SendToUser(
    [FromBody] SendNotificationRequest request)
{
    
    Console.WriteLine($"RecipientId received: {request.RecipientId}");

    var notification = await _notificationService.SendToUserAsync(
        request.RecipientId,
        request.Title,
        request.Message,
        request.Type);

    return Ok(notification);
}

    [HttpPut("mark-read")]
    public async Task<IActionResult> MarkAsRead([FromBody] MarkReadRequest request)
    {
        var userId = User.GetUserId();
        await _notificationService.MarkAsReadAsync(userId, request);
        return Ok();
    }

    [HttpPut("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = User.GetUserId();
        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        await _notificationService.DeleteNotificationAsync(userId, id);
        return NoContent();
    }
}
