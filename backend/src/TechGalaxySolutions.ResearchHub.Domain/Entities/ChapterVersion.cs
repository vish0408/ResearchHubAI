using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;

namespace TechGalaxySolutions.ResearchHub.Domain.Entities;

public class ChapterVersion : BaseEntity
{
    public Guid ChapterId { get; set; }
    public Chapter Chapter { get; set; } = null!;

    public int VersionNumber { get; set; }

    public string Content { get; set; } = string.Empty;

    // Uploaded chapter document
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public string? FileType { get; set; }
    public long? FileSize { get; set; }

    public ChapterStatus Status { get; set; } = ChapterStatus.Draft;
}