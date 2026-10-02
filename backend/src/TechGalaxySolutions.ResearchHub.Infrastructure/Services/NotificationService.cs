using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Common;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Notification;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public NotificationService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PagedResponse<NotificationResponse>> GetMyNotificationsAsync(Guid userId, PagedRequest request)
    {
        var query = _context.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsDeleted);

        var totalCount = await query.CountAsync();

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        var items = _mapper.Map<List<NotificationResponse>>(notifications);

        return new PagedResponse<NotificationResponse>
        {
            Items = items,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _context.Notifications.AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead && !n.IsDeleted);
    }

    public async Task<NotificationResponse> CreateNotificationAsync(Guid userId, string title, string message, string type)
    {
        var notification = new Domain.Entities.Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return _mapper.Map<NotificationResponse>(notification);
    }
    

public async Task<NotificationResponse> SendToUserAsync(
    Guid recipientId,
    string title,
    string message,
    string type)
{
    var userExists = await _context.Users
        .AnyAsync(u => u.Id == recipientId && !u.IsDeleted);

    if (!userExists)
    {
        throw new Exception(
            $"Recipient user not found in EF: {recipientId}");
    }

    var notification = new Domain.Entities.Notification
    {
        UserId = recipientId,
        Title = title,
        Message = message,
        Type = type,
        IsRead = false
    };

    _context.Notifications.Add(notification);
    await _context.SaveChangesAsync();

    return _mapper.Map<NotificationResponse>(notification);
}


    public async Task MarkAsReadAsync(Guid userId, MarkReadRequest request)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && request.NotificationIds.Contains(n.Id) && !n.IsDeleted)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead && !n.IsDeleted)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }

    public async Task DeleteNotificationAsync(Guid userId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId && !n.IsDeleted)
            ?? throw new KeyNotFoundException("Notification not found");

        notification.IsDeleted = true;
        await _context.SaveChangesAsync();
    }
}
