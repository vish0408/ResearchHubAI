namespace TechGalaxySolutions.ResearchHub.Application.DTOs.Notification;

public class SendNotificationRequest
{
    public Guid RecipientId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;
}