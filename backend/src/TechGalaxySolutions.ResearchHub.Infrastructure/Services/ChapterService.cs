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
private readonly IFileStorageService _fileStorageService;
   public ChapterService(
    ApplicationDbContext context,
    IMapper mapper,
    IFileStorageService fileStorageService)
{
    _context = context;
    _mapper = mapper;
    _fileStorageService = fileStorageService;
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

    if (request.File is null || request.File.Length == 0)
        throw new ArgumentException("Chapter file is required");

    var extension = Path.GetExtension(request.File.FileName)
        .ToLowerInvariant();

    var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };

    if (!allowedExtensions.Contains(extension))
        throw new ArgumentException(
            "Only PDF, DOC, and DOCX files are allowed");

    const long maxFileSize = 20 * 1024 * 1024;

    if (request.File.Length > maxFileSize)
        throw new ArgumentException(
            "Chapter file size cannot exceed 20 MB");

    var latestVersionNumber = await _context.Set<ChapterVersion>()
        .Where(v => v.ChapterId == chapterId && !v.IsDeleted)
        .Select(v => (int?)v.VersionNumber)
        .MaxAsync() ?? 0;

    var storedFilePath = await _fileStorageService.SaveFileAsync(
        request.File,
        "chapters");

   var version = new ChapterVersion
{
    ChapterId = chapterId,
    VersionNumber = latestVersionNumber + 1,
    Content = string.Empty,
    FileName = request.File.FileName,
    FilePath = storedFilePath,
    FileType = extension.TrimStart('.').ToUpperInvariant(),
    FileSize = request.File.Length,
    Status = ChapterStatus.Submitted
};

    _context.Set<ChapterVersion>().Add(version);

   chapter.Status = ChapterStatus.Submitted;

    await _context.SaveChangesAsync();

    return new ChapterVersionResponse
    {
        Id = version.Id,
        ChapterId = version.ChapterId,
        VersionNumber = version.VersionNumber,
        Content = version.Content,
        FileName = version.FileName,
        FilePath = version.FilePath,
        FileType = version.FileType,
        FileSize = version.FileSize,
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
        FileName = v.FileName,
        FilePath = v.FilePath,
         FileType = v.FileType,
        FileSize = v.FileSize,
        Status = v.Status.ToString(),
        CreatedAt = v.CreatedAt
    }).ToList();
}


public async Task<(byte[] Data, string FileName, string ContentType)> DownloadVersionAsync(
    Guid chapterId,
    Guid versionId,
    Guid userId)
{
    var version = await _context.Set<ChapterVersion>()
        .Include(v => v.Chapter)
            .ThenInclude(c => c.Project)
        .FirstOrDefaultAsync(v =>
            v.Id == versionId &&
            v.ChapterId == chapterId &&
            !v.IsDeleted);

    if (version is null)
        throw new KeyNotFoundException("Chapter version not found");

    var project = version.Chapter.Project;

    // Student who owns the project
    if (project.StudentId != userId)
    {
        // Otherwise, only the assigned guide can access it
        await EnsureGuideForProjectAsync(
            project.Id,
            userId);
    }

    if (string.IsNullOrWhiteSpace(version.FilePath))
        throw new FileNotFoundException(
            "Chapter version file not found");

    var fileData = await _fileStorageService.ReadFileAsync(
        version.FilePath);

    if (fileData is null)
        throw new FileNotFoundException(
            "Chapter version file not found");

    var fileName = version.FileName
        ?? Path.GetFileName(version.FilePath);

    var contentType = _fileStorageService.GetContentType(
        fileName);

    return (
        fileData,
        fileName,
        contentType
    );
}


public async Task<ChapterResponse> SubmitAsync(
    Guid chapterId,
    Guid userId)
{
    var chapter = await _context.Set<Chapter>()
        .Include(c => c.Project)
        .FirstOrDefaultAsync(c =>
            c.Id == chapterId &&
            !c.IsDeleted);

    if (chapter is null)
        throw new KeyNotFoundException("Chapter not found");

    // Only project owner can submit
    if (chapter.Project.StudentId != userId)
        throw new UnauthorizedAccessException(
            "Only the project owner can submit the chapter");

    // Chapter must currently be Draft
    if (chapter.Status != ChapterStatus.Draft)
        throw new InvalidOperationException(
            "Only a draft chapter can be submitted");

    chapter.Status = ChapterStatus.Submitted;

    // Keep latest version status in sync
    var latestVersion = await _context.Set<ChapterVersion>()
        .Where(v =>
            v.ChapterId == chapterId &&
            !v.IsDeleted)
        .OrderByDescending(v => v.VersionNumber)
        .FirstOrDefaultAsync();

    if (latestVersion is not null)
    {
        latestVersion.Status = ChapterStatus.Submitted;
    }

    await _context.SaveChangesAsync();

    return new ChapterResponse
    {
        Id = chapter.Id,
        ProjectId = chapter.ProjectId,
        Title = chapter.Title,
        Content = chapter.Content,
        Order = chapter.Order,
        Status = chapter.Status.ToString(),
        CreatedAt = chapter.CreatedAt
    };
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

    // Chapter file is required
    if (request.File is null || request.File.Length == 0)
        throw new ArgumentException("Chapter file is required");

    var extension = Path.GetExtension(request.File.FileName)
        .ToLowerInvariant();

    var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };

    if (!allowedExtensions.Contains(extension))
        throw new ArgumentException(
            "Only PDF, DOC, and DOCX files are allowed");

    const long maxFileSize = 20 * 1024 * 1024;

    if (request.File.Length > maxFileSize)
        throw new ArgumentException(
            "Chapter file size cannot exceed 20 MB");

    var storedFilePath = await _fileStorageService.SaveFileAsync(
        request.File,
        "chapters");

    var chapter = new Chapter
    {
        ProjectId = projectId,
        Title = request.Title.Trim(),
        Content = string.Empty,
        Order = request.Order,
        Status = ChapterStatus.Submitted
    };

    _context.Set<Chapter>().Add(chapter);

    var version = new ChapterVersion
    {
        Chapter = chapter,
        VersionNumber = 1,
        Content = string.Empty,
        FileName = request.File.FileName,
        FilePath = storedFilePath,
        FileType = extension.TrimStart('.').ToUpperInvariant(),
        FileSize = request.File.Length,
        Status = ChapterStatus.Submitted
    };

    _context.Set<ChapterVersion>().Add(version);

    await _context.SaveChangesAsync();

    return new ChapterResponse
    {
        Id = chapter.Id,
        ProjectId = chapter.ProjectId,
        Title = chapter.Title,
        Content = chapter.Content,
        Order = chapter.Order,
        Status = chapter.Status.ToString(),
        CreatedAt = chapter.CreatedAt
    };
}


public async Task<ChapterResponse> UpdateStatusAsync(
    Guid chapterId,
    Guid userId,
    UpdateChapterStatusRequest request)
{
    var chapter = await _context.Set<Chapter>()
        .Include(c => c.Comments)
            .ThenInclude(c => c.User)
        .FirstOrDefaultAsync(c =>
            c.Id == chapterId &&
            !c.IsDeleted)
        ?? throw new KeyNotFoundException("Chapter not found");

    await EnsureGuideForProjectAsync(
        chapter.ProjectId,
        userId);

    if (!Enum.TryParse<ChapterStatus>(
        request.Status,
        true,
        out var newStatus))
    {
        throw new ArgumentException(
            $"Invalid chapter status: {request.Status}");
    }

    chapter.Status = newStatus;

    var latestVersion = await _context.Set<ChapterVersion>()
        .Where(v =>
            v.ChapterId == chapterId &&
            !v.IsDeleted)
        .OrderByDescending(v => v.VersionNumber)
        .FirstOrDefaultAsync();

    if (latestVersion is not null)
    {
        latestVersion.Status = newStatus;
    }

    if (!string.IsNullOrWhiteSpace(request.Comment))
    {
        var comment = new ChapterComment
        {
            ChapterId = chapterId,
            UserId = userId,
            Content = request.Comment.Trim()
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
