using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;

namespace TechGalaxySolutions.ResearchHub.Domain.Entities;

public class TaskItem : BaseEntity
{
    public Guid ProjectId { get; set; }

    public Project Project { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public TaskItemStatus Status { get; set; } = TaskItemStatus.NotStarted;

    public DateTime? DueDate { get; set; }

    public Guid? AssignedToId { get; set; }

    public User? AssignedTo { get; set; }

    public Guid? MilestoneId { get; set; }

public Milestone? Milestone { get; set; }
}
