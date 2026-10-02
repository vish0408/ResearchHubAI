using TechGalaxySolutions.ResearchHub.Application.DTOs.Common;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Notification;

namespace TechGalaxySolutions.ResearchHub.Application.Interfaces;

public interface INotificationService
{
    Task<PagedResponse<NotificationResponse>> GetMyNotificationsAsync(Guid userId, PagedRequest request);
    Task<int> GetUnreadCountAsync(Guid userId);

    Task<NotificationResponse> CreateNotificationAsync(
        Guid userId,
        string title,
        string message,
        string type);

    Task MarkAsReadAsync(Guid userId, MarkReadRequest request);
    Task MarkAllAsReadAsync(Guid userId);
    Task DeleteNotificationAsync(Guid userId, Guid notificationId);

    // Guide → Student
    Task<NotificationResponse> SendToUserAsync(
        Guid recipientId,
        string title,
        string message,
        string type);
}