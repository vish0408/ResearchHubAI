// namespace TechGalaxySolutions.ResearchHub.Application.DTOs.ChapterComment;

// public class ChapterCommentResponse
// {
//     public Guid Id { get; set; }

//     public Guid UserId { get; set; }

//     public string UserName { get; set; } = string.Empty;

//     public string Content { get; set; } = string.Empty;

//     public int? LineNumber { get; set; }

//     public DateTime CreatedAt { get; set; }

//     // Reply relationship
//     public Guid? ParentCommentId { get; set; }

//     // Guide feedback resolution status
//     public bool IsResolved { get; set; }
// }

namespace TechGalaxySolutions.ResearchHub.Application.DTOs.ChapterComment;

public class ChapterCommentResponse
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public int? LineNumber { get; set; }

    public DateTime CreatedAt { get; set; }

    // Feedback thread
    public Guid? FeedbackThreadId { get; set; }

    // Reply relationship
    public Guid? ParentCommentId { get; set; }

    // Guide feedback resolution status
    public bool IsResolved { get; set; }

    public bool IsRead { get; set; }
}