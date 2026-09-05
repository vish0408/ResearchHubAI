using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Common;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Project;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class ProjectService : IProjectService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ProjectService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PagedResponse<ProjectResponse>> GetMyProjectsAsync(Guid userId, PagedRequest request)
    {
        var query = _context.Projects.AsNoTracking()
            .Include(p => p.Student)
            .Include(p => p.Members).ThenInclude(m => m.User)
            .Where(p => p.StudentId == userId && !p.IsDeleted);

        var totalCount = await query.CountAsync();

        var projects = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        var items = _mapper.Map<List<ProjectResponse>>(projects);

        return new PagedResponse<ProjectResponse>
        {
            Items = items,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ProjectResponse> GetByIdAsync(Guid projectId, Guid userId)
    {
        var project = await _context.Projects.AsNoTracking()
            .Include(p => p.Student)
            .Include(p => p.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(p => p.Id == projectId && !p.IsDeleted)
            ?? throw new KeyNotFoundException("Project not found");

        if (project.StudentId != userId && !project.Members.Any(m => m.UserId == userId))
            throw new UnauthorizedAccessException("Access denied");

        return _mapper.Map<ProjectResponse>(project);
    }

    public async Task<ProjectResponse> CreateAsync(Guid userId, CreateProjectRequest request)
    {
        var project = new Project
        {
            Title = request.Title,
            Description = request.Description,
            StudentId = userId,
            Status = ProjectStatus.NotStarted,
            StartDate = DateTime.UtcNow,
            TargetEndDate = request.TargetEndDate,
            CompletionPercentage = 0,
        };

        _context.Projects.Add(project);

        var member = new ProjectMember
        {
            ProjectId = project.Id,
            UserId = userId,
            Role = MemberRole.Leader,
        };
        _context.ProjectMembers.Add(member);

        await _context.SaveChangesAsync();

        var studentProfile = await _context.Set<StudentProfile>()
            .FirstOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);
        if (studentProfile?.GuideId != null)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = studentProfile.GuideId.Value,
                Title = "New Project Created",
                Message = $"Student has created a new project: '{project.Title}'.",
                Type = "info",
            });
            await _context.SaveChangesAsync();
        }

        return await GetByIdAsync(project.Id, userId);
    }

    public async Task<ProjectResponse> UpdateAsync(Guid projectId, Guid userId, UpdateProjectRequest request)
    {
        var project = await _context.Projects
            .Include(p => p.Student)
            .Include(p => p.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(p => p.Id == projectId && !p.IsDeleted)
            ?? throw new KeyNotFoundException("Project not found");

        if (project.StudentId != userId)
            throw new UnauthorizedAccessException("Only the project owner can update");

        project.Title = request.Title;
        project.Description = request.Description;
        project.TargetEndDate = request.TargetEndDate;

        if (project.Status != ProjectStatus.Completed)
        {
            project.Status = ProjectStatus.InProgress;
        }

        await _context.SaveChangesAsync();

        return _mapper.Map<ProjectResponse>(project);
    }

    public async Task DeleteAsync(Guid projectId, Guid userId)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && !p.IsDeleted)
            ?? throw new KeyNotFoundException("Project not found");

        if (project.StudentId != userId)
            throw new UnauthorizedAccessException("Only the project owner can delete");

        project.IsDeleted = true;
        await _context.SaveChangesAsync();
    }

    public async Task<ProjectMemberResponse> AddMemberAsync(Guid projectId, Guid userId, Guid memberUserId, string role)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && !p.IsDeleted)
            ?? throw new KeyNotFoundException("Project not found");

        if (project.StudentId != userId)
            throw new UnauthorizedAccessException("Only the project owner can add members");

        var member = new ProjectMember
        {
            ProjectId = projectId,
            UserId = memberUserId,
            Role = Enum.Parse<MemberRole>(role),
        };

        _context.ProjectMembers.Add(member);

        var user = await _context.Users.FindAsync(memberUserId)
            ?? throw new KeyNotFoundException("User not found");

        await _context.SaveChangesAsync();

        return new ProjectMemberResponse
        {
            Id = member.Id,
            UserId = memberUserId,
            UserName = user.FullName,
            Email = user.Email,
            Role = role,
        };
    }

    public async Task RemoveMemberAsync(Guid projectId, Guid userId, Guid memberId)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && !p.IsDeleted)
            ?? throw new KeyNotFoundException("Project not found");

        if (project.StudentId != userId)
            throw new UnauthorizedAccessException("Only the project owner can remove members");

        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(m => m.Id == memberId && m.ProjectId == projectId)
            ?? throw new KeyNotFoundException("Member not found");

        _context.ProjectMembers.Remove(member);
        await _context.SaveChangesAsync();
    }

    public async Task<double> RecalculateCompletionPercentageAsync(Guid projectId)
    {
        var project = await _context.Projects
            .Include(p => p.Tasks)
            .Include(p => p.Milestones)
            .Include(p => p.Documents)
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(p => p.Id == projectId && !p.IsDeleted)
            ?? throw new KeyNotFoundException("Project not found");

        double score = 0;

        // var milestones = project.Milestones.Where(m => !m.IsDeleted).ToList();
        // if (milestones.Count > 0)
        // {
        //     var completedCount = milestones.Count(m => m.IsCompleted);
        //     score += (double)completedCount / milestones.Count * 50;
        // }

        var milestones = project.Milestones
    .Where(m => !m.IsDeleted)
    .ToList();

if (milestones.Count > 0)
{
    var completedCount = milestones.Count(m => m.IsCompleted);
    score += (double)completedCount / milestones.Count * 40;
}

var tasks = project.Tasks
    .Where(t => !t.IsDeleted)
    .ToList();

if (tasks.Count > 0)
{
    var completedCount = tasks.Count(t => t.Status == TaskItemStatus.Completed);
    score += (double)completedCount / tasks.Count * 20;
}

        var docs = project.Documents.Where(d => !d.IsDeleted).ToList();
        if (docs.Count > 0)
        {
            // var unit = 25.0 / Math.Max(docs.Count, 1);

            var unit = 20.0 / Math.Max(docs.Count, 1);
            var docScore = docs.Sum(d => d.DocumentStatus == "Migrated" || !string.IsNullOrEmpty(d.StoredFilePath) ? unit : 0);
            // score += Math.Min(docScore, 25);
            score += Math.Min(docScore, 20);
        }

        var reviews = project.Reviews.Where(r => !r.IsDeleted).ToList();
        var docReviews = await _context.Set<DocumentReview>().AsNoTracking()
            .Where(r => r.ProjectId == projectId && !r.IsDeleted)
            .ToListAsync();
        var allReviews = reviews.Concat(docReviews.Cast<object>()).ToList();
        if (allReviews.Count > 0)
        {
            var approved = reviews.Count(r => r.Status == ReviewStatus.Approved)
                         + docReviews.Count(r => r.Status == "Approved");
            // score += (double)approved / allReviews.Count * 25;
            score += (double)approved / allReviews.Count * 20;
        }

        project.CompletionPercentage = Math.Round(Math.Min(score, 100), 1);
        project.UpdatedAt = DateTime.UtcNow;

        if (project.CompletionPercentage >= 100 && project.Status != ProjectStatus.Completed)
        {
            project.Status = ProjectStatus.Completed;
        }
        else if (project.CompletionPercentage > 0 && project.Status == ProjectStatus.NotStarted)
        {
            project.Status = ProjectStatus.InProgress;
        }

        await _context.SaveChangesAsync();
        return project.CompletionPercentage;
    }

    public async Task<ProjectResponse> SubmitFinalThesisAsync(Guid projectId, Guid userId)
    {
        var project = await _context.Projects
            .Include(p => p.Milestones)
            .Include(p => p.Documents)
            .FirstOrDefaultAsync(p => p.Id == projectId && !p.IsDeleted)
            ?? throw new KeyNotFoundException("Project not found");

        if (project.StudentId != userId)
            throw new UnauthorizedAccessException("Only the project owner can submit");

        if (project.Status == ProjectStatus.Completed)
            throw new InvalidOperationException("Project is already completed");

        var incompleteMilestones = project.Milestones
            .Where(m => !m.IsDeleted && !m.IsCompleted)
            .ToList();
        if (incompleteMilestones.Count > 0)
            throw new InvalidOperationException(
                $"Cannot submit final thesis. {incompleteMilestones.Count} milestone(s) are not completed. Complete all milestones first.");

        var uploadedDocs = project.Documents.Where(d => !d.IsDeleted).ToList();
        if (uploadedDocs.Count == 0)
            throw new InvalidOperationException("Cannot submit final thesis. Upload at least one document first.");

        await RecalculateCompletionPercentageAsync(projectId);

        var studentProfile = await _context.Set<StudentProfile>()
            .FirstOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);
        if (studentProfile?.GuideId != null)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = studentProfile.GuideId.Value,
                Title = "Final Thesis Submitted",
                Message = $"Student has submitted the final thesis for project '{project.Title}'. Please review.",
                Type = "info",
            });

            var hodProfile = await _context.Set<DepartmentProfile>()
                .FirstOrDefaultAsync(d => !d.IsDeleted);
            if (hodProfile?.HodUserId != null)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = hodProfile.HodUserId.Value,
                    Title = "Final Thesis Submitted",
                    Message = $"Final thesis submitted for project '{project.Title}' by student.",
                    Type = "info",
                });
            }
            await _context.SaveChangesAsync();
        }

        return await GetByIdAsync(projectId, userId);
    }
}
