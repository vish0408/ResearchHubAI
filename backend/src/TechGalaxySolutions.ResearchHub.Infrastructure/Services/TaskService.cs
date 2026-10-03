using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Task;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class TaskService : ITaskService
{
    // private readonly ApplicationDbContext _context;
    // private readonly IMapper _mapper;

    private readonly ApplicationDbContext _context;
private readonly IMapper _mapper;
private readonly IProjectService _projectService;

    // public TaskService(ApplicationDbContext context, IMapper mapper)
    // {
    //     _context = context;
    //     _mapper = mapper;
    // }

    public TaskService(
    ApplicationDbContext context,
    IMapper mapper,
    IProjectService projectService)
{
    _context = context;
    _mapper = mapper;
    _projectService = projectService;
}

    public async Task<List<TaskItemResponse>> GetProjectTasksAsync(Guid projectId, Guid userId)
    {
        await VerifyProjectAccess(projectId, userId);

        var tasks = await _context.TaskItems.AsNoTracking()
            .Include(t => t.AssignedTo)
            .Where(t => t.ProjectId == projectId && !t.IsDeleted)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<TaskItemResponse>>(tasks);
    }

    public async Task<TaskItemResponse> GetByIdAsync(Guid taskId, Guid userId)
    {
        var task = await _context.TaskItems.AsNoTracking()
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == taskId && !t.IsDeleted)
            ?? throw new KeyNotFoundException("Task not found");

        await VerifyProjectAccess(task.ProjectId, userId);

        return _mapper.Map<TaskItemResponse>(task);
    }

    public async Task<TaskItemResponse> CreateAsync(Guid projectId, Guid userId, CreateTaskItemRequest request)
    {
        await VerifyProjectAccess(projectId, userId);

        var task = new TaskItem
        {
            ProjectId = projectId,
            Title = request.Title,
            Description = request.Description,
            Priority = Enum.Parse<TaskPriority>(request.Priority),
            Status = TaskItemStatus.NotStarted,
            DueDate = request.DueDate,
            AssignedToId = request.AssignedToId,
            MilestoneId = request.MilestoneId,
        };

        // _context.TaskItems.Add(task);
        // await _context.SaveChangesAsync();

        // return await GetByIdAsync(task.Id, userId);

        _context.TaskItems.Add(task);
await _context.SaveChangesAsync();

await _projectService.RecalculateCompletionPercentageAsync(projectId);

return await GetByIdAsync(task.Id, userId);

    }

    public async Task<TaskItemResponse> UpdateAsync(Guid taskId, Guid userId, UpdateTaskItemRequest request)
    {
        var task = await _context.TaskItems
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == taskId && !t.IsDeleted)
            ?? throw new KeyNotFoundException("Task not found");

        await VerifyProjectAccess(task.ProjectId, userId);

        task.Title = request.Title;
        task.Description = request.Description;
        task.Priority = Enum.Parse<TaskPriority>(request.Priority);
        task.Status = Enum.Parse<TaskItemStatus>(request.Status);
        task.DueDate = request.DueDate;
        task.AssignedToId = request.AssignedToId;

        // await _context.SaveChangesAsync();

        // return _mapper.Map<TaskItemResponse>(task);

       await _context.SaveChangesAsync();

await UpdateMilestoneCompletionAsync(task.MilestoneId);

await _projectService.RecalculateCompletionPercentageAsync(task.ProjectId);

return _mapper.Map<TaskItemResponse>(task);

    }

    public async Task DeleteAsync(Guid taskId, Guid userId)
    {
        var task = await _context.TaskItems
            .FirstOrDefaultAsync(t => t.Id == taskId && !t.IsDeleted)
            ?? throw new KeyNotFoundException("Task not found");

        await VerifyProjectAccess(task.ProjectId, userId);

        // task.IsDeleted = true;
        // await _context.SaveChangesAsync();

        task.IsDeleted = true;
await _context.SaveChangesAsync();

await _projectService.RecalculateCompletionPercentageAsync(task.ProjectId);

    }


private async Task UpdateMilestoneCompletionAsync(Guid? milestoneId)
{
    if (!milestoneId.HasValue)
        return;

    var milestone = await _context.Milestones
        .Include(m => m.Tasks)
        .FirstOrDefaultAsync(m =>
            m.Id == milestoneId.Value &&
            !m.IsDeleted);

    if (milestone == null)
        return;

    var activeTasks = milestone.Tasks
        .Where(t => !t.IsDeleted)
        .ToList();

    milestone.IsCompleted =
        activeTasks.Count > 0 &&
        activeTasks.All(t => t.Status == TaskItemStatus.Completed);

    await _context.SaveChangesAsync();
}


    private async Task VerifyProjectAccess(Guid projectId, Guid userId)
    {
        var project = await _context.Projects.AsNoTracking()
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == projectId && !p.IsDeleted)
            ?? throw new KeyNotFoundException("Project not found");

        if (project.StudentId != userId && !project.Members.Any(m => m.UserId == userId))
            throw new UnauthorizedAccessException("Access denied");
    }
}
