using TechGalaxySolutions.ResearchHub.Application.DTOs.Chapter;

namespace TechGalaxySolutions.ResearchHub.Application.Interfaces;

public interface IChapterService
{
    Task<List<ChapterResponse>> GetProjectChaptersAsync(Guid projectId);
    Task<ChapterResponse> GetByIdAsync(Guid chapterId);
    Task<ChapterResponse> UpdateStatusAsync(Guid chapterId, Guid userId, UpdateChapterStatusRequest request);
    Task<ChapterResponse> CreateAsync(Guid projectId, Guid userId, CreateChapterRequest request);
    Task<List<ChapterVersionResponse>> GetVersionsAsync(Guid chapterId);
    Task<ChapterVersionResponse> CreateVersionAsync(
    Guid chapterId,
    Guid userId,
    CreateChapterVersionRequest request);
}
