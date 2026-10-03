// namespace TechGalaxySolutions.ResearchHub.Application.DTOs.ChapterComment;

// public class AddChapterCommentRequest
// {
//     public string Content { get; set; }
//     public int? LineNumber { get; set; }
//     public Guid? ParentCommentId { get; set; }
// }

namespace TechGalaxySolutions.ResearchHub.Application.DTOs.ChapterComment;

public class AddChapterCommentRequest
{
    public string Content { get; set; } = string.Empty;

    public int? LineNumber { get; set; }

    public Guid? ParentCommentId { get; set; }

    // Existing feedback thread being continued.
    public Guid? FeedbackThreadId { get; set; }
}