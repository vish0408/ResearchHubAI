using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Dashboard;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public DashboardService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<DashboardResponse> GetStudentDashboardAsync(Guid userId)
    {
        var project = await _context.Projects.AsNoTracking()
            .Include(p => p.Milestones)
            .Include(p => p.Documents).ThenInclude(d => d.Uploader)
            .Include(p => p.Tasks)
            .Where(p => p.StudentId == userId && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        var notifications = await _context.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .ToListAsync();

        var response = new DashboardResponse();
        // Coursework Summary
var studentProfile = await _context.StudentProfiles
    .AsNoTracking()
    .FirstOrDefaultAsync(sp => sp.UserId == userId && !sp.IsDeleted);

if (studentProfile != null)
{
    var coursework = await _context.ScholarCoursework
        .AsNoTracking()
        .Where(c =>
            c.StudentProfileId == studentProfile.Id &&
            !c.IsDeleted)
        .ToListAsync();

    if (coursework.Count > 0)
    {
        var requiredCredits = coursework.Sum(c => c.Credits);

        var earnedCredits = coursework
            .Where(c => c.IsCompleted)
            .Sum(c => c.Credits);

        var passedPapers = coursework.Count(c => c.IsCompleted);

        var pendingPapers = coursework.Count(c => !c.IsCompleted);

        response.RequiredCredits = requiredCredits;
        response.EarnedCredits = earnedCredits;
        response.PassedPapers = passedPapers;
        response.PendingPapers = pendingPapers;

        response.CourseworkStatus =
            earnedCredits == 0
                ? "Not started"
                : earnedCredits >= requiredCredits
                    ? "Completed"
                    : "In Progress";

        response.CourseworkCompletionPercentage =
            requiredCredits > 0
                ? Math.Round(
                    (decimal)earnedCredits / requiredCredits * 100,
                    2)
                : 0;
    }
    else
    {
        response.CourseworkStatus = "Not started";
        response.RequiredCredits = 0;
        response.EarnedCredits = 0;
        response.PassedPapers = 0;
        response.PendingPapers = 0;
        response.CourseworkCompletionPercentage = 0;
    }
}

        if (project != null)
        {
            response.CurrentProject = _mapper.Map<ProjectSummary>(project);
            response.CompletionPercentage = (int)project.CompletionPercentage;
           
           
  var activeMilestoneIds = project.Milestones
    .Where(m => !m.IsDeleted)
    .Select(m => m.Id)
    .ToHashSet();

var activeTasks = project.Tasks
    .Where(t =>
        !t.IsDeleted &&
        t.MilestoneId.HasValue &&
        activeMilestoneIds.Contains(t.MilestoneId.Value))
    .ToList();

response.PendingTasks = activeTasks.Count(
    t => t.Status != TaskItemStatus.Completed);

response.CompletedTasks = activeTasks.Count(
    t => t.Status == TaskItemStatus.Completed);


         response.UpcomingMilestones = project.Milestones
    .Where(m => !m.IsDeleted)
    .OrderBy(m => m.TargetDate)
    .Select(m =>
    {
        var tasks = project.Tasks
            .Where(t => !t.IsDeleted && t.MilestoneId == m.Id)
            .ToList();

        var isCompleted =
            tasks.Count > 0 &&
            tasks.All(t => t.Status == TaskItemStatus.Completed);

        return new MilestoneSummary
        {
            Id = m.Id,
            Title = m.Title,
            TargetDate = m.TargetDate,
            IsCompleted = isCompleted
        };
    })
    .Where(m => !m.IsCompleted)
    .Take(5)
    .ToList();

            response.RecentDocuments = _mapper.Map<List<DocumentSummary>>(
                project.Documents.Where(d => !d.IsDeleted).OrderByDescending(d => d.UploadedAt).Take(5));
        }
        

        response.Notifications = _mapper.Map<List<Application.DTOs.Notification.NotificationResponse>>(notifications);

        return response;
    }
}
