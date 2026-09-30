public class ChapterVersionResponse
{
    public Guid Id { get; set; }
    public Guid ChapterId { get; set; }
    public int VersionNumber { get; set; }

    public string Content { get; set; } = string.Empty;

    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public string? FileType { get; set; }
    public long? FileSize { get; set; }

    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}