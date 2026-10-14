using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Dashboard;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
  

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
    .FirstOrDefaultAsync(sp =>
        sp.UserId == userId && !sp.IsDeleted);

if (studentProfile != null)
{
    var approvedCoursework = await _context
        .Set<StudentCourseworkSubmission>()
        .AsNoTracking()
        .Where(c =>
            c.StudentProfileId == studentProfile.Id &&
            !c.IsDeleted &&
            c.Status == ReviewStatus.Approved)
        .ToListAsync();

    var pendingPapers = await _context
        .Set<StudentCourseworkSubmission>()
        .AsNoTracking()
        .CountAsync(c =>
            c.StudentProfileId == studentProfile.Id &&
            !c.IsDeleted &&
            c.Status == ReviewStatus.Pending);

    var earnedCredits = approvedCoursework.Sum(c => c.Credits);
    var passedPapers = approvedCoursework.Count;

    response.EarnedCredits = earnedCredits;
    response.PassedPapers = passedPapers;
    response.PendingPapers = pendingPapers;

    // Do not treat a missing requirement as zero.
    response.RequiredCredits = studentProfile.RequiredCredits;

    if (!studentProfile.RequiredCredits.HasValue ||
        studentProfile.RequiredCredits.Value <= 0)
    {
        response.CourseworkStatus =
            "Requirement not configured";

        response.CourseworkCompletionPercentage = 0;
    }
    else
    {
        var requiredCredits = studentProfile.RequiredCredits.Value;

        response.CourseworkStatus =
            earnedCredits >= requiredCredits
                ? "Completed"
                : earnedCredits > 0
                    ? "In Progress"
                    : "Not started";

        response.CourseworkCompletionPercentage =
            Math.Round(
                (decimal)earnedCredits / requiredCredits * 100,
                2);

        // Prevent percentages above 100.
        response.CourseworkCompletionPercentage =
            Math.Min(
                response.CourseworkCompletionPercentage,
                100);
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
