namespace TechGalaxySolutions.ResearchHub.Application.DTOs.Task;

public class TaskItemResponse
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? MilestoneId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public Guid? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime CreatedAt { get; set; }
    
}

public class CreateTaskItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
    public Guid? AssignedToId { get; set; }

    public Guid? MilestoneId { get; set; }
}

public class UpdateTaskItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
    public string Status { get; set; } = "NotStarted";
    public DateTime? DueDate { get; set; }
    public Guid? AssignedToId { get; set; }
}
