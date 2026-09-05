using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Chapter;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class ChapterService : IChapterService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ChapterService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<ChapterResponse>> GetProjectChaptersAsync(Guid projectId)
    {
        var chapters = await _context.Set<Chapter>().AsNoTracking()
            .Include(c => c.Comments).ThenInclude(c => c.User)
            .Where(c => c.ProjectId == projectId && !c.IsDeleted)
            .OrderBy(c => c.Order)
            .ToListAsync();

        return _mapper.Map<List<ChapterResponse>>(chapters);
    }

    public async Task<ChapterResponse> GetByIdAsync(Guid chapterId)
    {
        var chapter = await _context.Set<Chapter>().AsNoTracking()
            .Include(c => c.Comments).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == chapterId && !c.IsDeleted)
            ?? throw new KeyNotFoundException("Chapter not found");

        return _mapper.Map<ChapterResponse>(chapter);
    }

        public async Task<ChapterVersionResponse> CreateVersionAsync(
        Guid chapterId,
        Guid userId,
        CreateChapterVersionRequest request)
    {
        var chapter = await _context.Set<Chapter>()
            .Include(c => c.Project)
            .FirstOrDefaultAsync(c => c.Id == chapterId && !c.IsDeleted)
            ?? throw new KeyNotFoundException("Chapter not found");

        if (chapter.Project.StudentId != userId)
            throw new UnauthorizedAccessException(
                "Only the project owner can create chapter versions");

        if (string.IsNullOrWhiteSpace(request.Content))
            throw new ArgumentException("Chapter content is required");

        var latestVersionNumber = await _context.Set<ChapterVersion>()
            .Where(v => v.ChapterId == chapterId && !v.IsDeleted)
            .Select(v => (int?)v.VersionNumber)
            .MaxAsync() ?? 0;

        var version = new ChapterVersion
        {
            ChapterId = chapterId,
            VersionNumber = latestVersionNumber + 1,
            Content = request.Content.Trim(),
            Status = ChapterStatus.Draft
        };

        _context.Set<ChapterVersion>().Add(version);

        chapter.Content = version.Content;
        chapter.Status = ChapterStatus.Draft;

        await _context.SaveChangesAsync();

        return new ChapterVersionResponse
        {
            Id = version.Id,
            ChapterId = version.ChapterId,
            VersionNumber = version.VersionNumber,
            Content = version.Content,
            Status = version.Status.ToString(),
            CreatedAt = version.CreatedAt
        };
    }
public async Task<List<ChapterVersionResponse>> GetVersionsAsync(Guid chapterId)
{
    var versions = await _context.Set<ChapterVersion>()
        .AsNoTracking()
        .Where(v => v.ChapterId == chapterId && !v.IsDeleted)
        .OrderBy(v => v.VersionNumber)
        .ToListAsync();

    return versions.Select(v => new ChapterVersionResponse
    {
        Id = v.Id,
        ChapterId = v.ChapterId,
        VersionNumber = v.VersionNumber,
        Content = v.Content,
        Status = v.Status.ToString(),
        CreatedAt = v.CreatedAt
    }).ToList();
}
    
    public async Task<ChapterResponse> CreateAsync(
    Guid projectId,
    Guid userId,
    CreateChapterRequest request)
{
    var project = await _context.Projects
        .FirstOrDefaultAsync(p =>
            p.Id == projectId &&
            !p.IsDeleted)
        ?? throw new KeyNotFoundException("Project not found");

    // Only the student who owns the project can create chapters
    if (project.StudentId != userId)
        throw new UnauthorizedAccessException(
            "Only the project owner can create chapters");

    if (string.IsNullOrWhiteSpace(request.Title))
        throw new ArgumentException("Chapter title is required");

    var chapter = new Chapter
    {
        ProjectId = projectId,
        Title = request.Title.Trim(),
        Content = request.Content ?? string.Empty,
        Order = request.Order,
        Status = ChapterStatus.Draft
    };

    _context.Set<Chapter>().Add(chapter);

    var version = new ChapterVersion
{
    Chapter = chapter,
    VersionNumber = 1,
    Content = chapter.Content,
    Status = ChapterStatus.Draft
};

_context.Set<ChapterVersion>().Add(version);

    await _context.SaveChangesAsync();

    return _mapper.Map<ChapterResponse>(chapter);
}

   public async Task<ChapterResponse> UpdateStatusAsync(
    Guid chapterId,
    Guid userId,
    UpdateChapterStatusRequest request)
{
    var chapter = await _context.Set<Chapter>()
        .Include(c => c.Comments)
            .ThenInclude(c => c.User)
        .FirstOrDefaultAsync(c => c.Id == chapterId && !c.IsDeleted)
        ?? throw new KeyNotFoundException("Chapter not found");

    await EnsureGuideForProjectAsync(chapter.ProjectId, userId);

    if (!Enum.TryParse<ChapterStatus>(
        request.Status,
        true,
        out var newStatus))
    {
        throw new ArgumentException(
            $"Invalid chapter status: {request.Status}");
    }

    // Update chapter status
    chapter.Status = newStatus;

    // Update latest chapter version status
    var latestVersion = await _context.Set<ChapterVersion>()
        .Where(v =>
            v.ChapterId == chapterId &&
            !v.IsDeleted)
        .OrderByDescending(v => v.VersionNumber)
        .FirstOrDefaultAsync();

    if (latestVersion != null)
    {
        latestVersion.Status = newStatus;
    }

    // Add guide comment if provided
    if (!string.IsNullOrWhiteSpace(request.Comment))
    {
        var comment = new ChapterComment
        {
            ChapterId = chapterId,
            UserId = userId,
            Content = request.Comment.Trim(),
        };

        _context.Set<ChapterComment>().Add(comment);
    }

    await _context.SaveChangesAsync();

    return _mapper.Map<ChapterResponse>(chapter);
}



    private async Task EnsureGuideForProjectAsync(Guid projectId, Guid userId)
    {
        var project = await _context.Projects.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == projectId && !p.IsDeleted)
            ?? throw new KeyNotFoundException("Project not found");

        var studentProfile = await _context.Set<StudentProfile>().AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == project.StudentId && !s.IsDeleted);

        var activeAllocation = await _context.Set<ProjectAllocation>().AsNoTracking()
            .Where(a => !a.IsDeleted
                && a.Status == AllocationStatus.Active
                && a.StudentId == project.StudentId)
            .OrderByDescending(a => a.AllocatedAt)
            .FirstOrDefaultAsync();

        var effectiveGuideId = activeAllocation?.GuideId ?? studentProfile?.GuideId;

        if (effectiveGuideId != userId)
            throw new UnauthorizedAccessException("Only the assigned guide can update this chapter");
    }
}
