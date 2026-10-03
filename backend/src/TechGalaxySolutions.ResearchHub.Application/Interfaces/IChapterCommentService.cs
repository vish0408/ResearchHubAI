// using TechGalaxySolutions.ResearchHub.Application.DTOs.ChapterComment;

// namespace TechGalaxySolutions.ResearchHub.Application.Interfaces;

// public interface IChapterCommentService
// {
//     Task<List<ChapterCommentResponse>> GetChapterCommentsAsync(Guid chapterId);
//     Task<ChapterCommentResponse> AddCommentAsync(Guid chapterId, Guid userId, AddChapterCommentRequest request);
//     Task DeleteCommentAsync(Guid commentId, Guid userId);
// }
using TechGalaxySolutions.ResearchHub.Application.DTOs.ChapterComment;

namespace TechGalaxySolutions.ResearchHub.Application.Interfaces;

public interface IChapterCommentService
{
    Task<List<ChapterCommentResponse>> GetChapterCommentsAsync(
        Guid chapterId);

    Task<ChapterCommentResponse> AddCommentAsync(
        Guid chapterId,
        Guid userId,
        AddChapterCommentRequest request);

    Task<ChapterCommentResponse> ResolveCommentAsync(
        Guid commentId,
        Guid userId);

    Task DeleteCommentAsync(
        Guid commentId,
        Guid userId);

    Task MarkThreadAsReadAsync(
    Guid chapterId,
    Guid threadId,
    Guid userId);    
}