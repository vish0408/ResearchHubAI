// namespace TechGalaxySolutions.ResearchHub.Domain.Entities;

// public class ChapterComment : BaseEntity
// {
//     public Guid ChapterId { get; set; }

//     public Chapter Chapter { get; set; } = null!;

//     public Guid UserId { get; set; }

//     public User User { get; set; } = null!;

//     public string Content { get; set; } = string.Empty;

//     public int? LineNumber { get; set; }

//     // Reply relationship
//     public Guid? ParentCommentId { get; set; }

//     public ChapterComment? ParentComment { get; set; }

    

//     public ICollection<ChapterComment> Replies { get; set; }
//         = new List<ChapterComment>();

//     // Guide feedback resolution status
//     public bool IsResolved { get; set; } = false;
// }

namespace TechGalaxySolutions.ResearchHub.Domain.Entities;

public class ChapterComment : BaseEntity
{
    public Guid ChapterId { get; set; }

    public Chapter Chapter { get; set; } = null!;

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    public int? LineNumber { get; set; }

    // Feedback thread
    // All Guide follow-up comments and Student replies
    // belonging to the same feedback cycle share this ID.
    public Guid? FeedbackThreadId { get; set; }

    // Reply relationship
    public Guid? ParentCommentId { get; set; }

    public ChapterComment? ParentComment { get; set; }

    public ICollection<ChapterComment> Replies { get; set; }
        = new List<ChapterComment>();

    // Resolution status of the feedback thread.
    // This value is meaningful for the root Guide feedback.
    public bool IsResolved { get; set; } = false;

    public bool IsRead { get; set; } = false;
}