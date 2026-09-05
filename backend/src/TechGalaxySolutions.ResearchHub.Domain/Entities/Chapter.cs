using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;

namespace TechGalaxySolutions.ResearchHub.Domain.Entities;

public class Chapter : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int Order { get; set; }
    public ChapterStatus Status { get; set; } = ChapterStatus.Draft;
    public ICollection<ChapterComment> Comments { get; set; } = new List<ChapterComment>();
    public ICollection<ChapterVersion> Versions { get; set; } = new List<ChapterVersion>();
}
