namespace TechGalaxySolutions.ResearchHub.Domain.Entities;

public class Milestone : BaseEntity
{
    public Guid ProjectId { get; set; }

    public Project Project { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime TargetDate { get; set; }

    public bool IsCompleted { get; set; }

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}