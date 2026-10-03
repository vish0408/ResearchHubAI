using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Application.DTOs.ChapterComment;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class ChapterCommentService : IChapterCommentService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ChapterCommentService(
        ApplicationDbContext context,
        IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<ChapterCommentResponse>> GetChapterCommentsAsync(
        Guid chapterId)
    {
        var comments = await _context.Set<ChapterComment>()
            .AsNoTracking()
            .Include(c => c.User)
            .Where(c =>
                c.ChapterId == chapterId &&
                !c.IsDeleted)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<ChapterCommentResponse>>(comments);
    }

    public async Task<ChapterCommentResponse> AddCommentAsync(
    Guid chapterId,
    Guid userId,
    AddChapterCommentRequest request)
{
    var chapter = await _context.Set<Chapter>()
        .FirstOrDefaultAsync(c =>
            c.Id == chapterId &&
            !c.IsDeleted);

    if (chapter == null)
        throw new KeyNotFoundException("Chapter not found");

    Guid? feedbackThreadId = null;

    // ---------------------------------------------------------
    // CASE 1:
    // Student is replying to an existing comment.
    // ---------------------------------------------------------
    if (request.ParentCommentId.HasValue)
    {
        var parentComment = await _context.Set<ChapterComment>()
            .AsNoTracking()
            .FirstOrDefaultAsync(c =>
                c.Id == request.ParentCommentId.Value &&
                c.ChapterId == chapterId &&
                !c.IsDeleted);

        if (parentComment == null)
            throw new KeyNotFoundException(
                "Parent comment not found");

        feedbackThreadId = parentComment.FeedbackThreadId;
    }

    // ---------------------------------------------------------
    // CASE 2:
    // No parent comment.
    //
    // This is a new root comment.
    //
    // If it is the Guide continuing the existing feedback cycle,
    // use the latest unresolved feedback thread.
    // Otherwise create a new feedback thread.
    // ---------------------------------------------------------
    if (!feedbackThreadId.HasValue)
    {
        var existingThreadId = await _context.Set<ChapterComment>()
            .AsNoTracking()
            .Where(c =>
                c.ChapterId == chapterId &&
                !c.IsDeleted &&
                c.FeedbackThreadId.HasValue &&
                !c.IsResolved)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => c.FeedbackThreadId)
            .FirstOrDefaultAsync();

        feedbackThreadId = existingThreadId ?? Guid.NewGuid();
    }

    var comment = new ChapterComment
    {
        ChapterId = chapterId,
        UserId = userId,
        Content = request.Content,
        LineNumber = request.LineNumber,
        ParentCommentId = request.ParentCommentId,

        // All comments belonging to the same feedback cycle
        // share the same thread ID.
        FeedbackThreadId = feedbackThreadId,

        // Individual comments are not resolved.
        // Resolution belongs to the feedback thread.
        IsResolved = false
    };

    _context.Set<ChapterComment>().Add(comment);

    await _context.SaveChangesAsync();

    comment.User = (await _context.Users.FindAsync(userId))!;

    return _mapper.Map<ChapterCommentResponse>(comment);
}


public async Task MarkThreadAsReadAsync(
    Guid chapterId,
    Guid threadId,
    Guid userId)
{
    // ---------------------------------------------------------
    // 1. Load chapter and its project
    // ---------------------------------------------------------
    var chapter = await _context.Set<Chapter>()
        .AsNoTracking()
        .FirstOrDefaultAsync(c =>
            c.Id == chapterId &&
            !c.IsDeleted);

    if (chapter == null)
    {
        throw new KeyNotFoundException("Chapter not found");
    }

    var project = await _context.Set<Project>()
        .AsNoTracking()
        .FirstOrDefaultAsync(p =>
            p.Id == chapter.ProjectId &&
            !p.IsDeleted);

    if (project == null)
    {
        throw new KeyNotFoundException("Project not found");
    }

    // ---------------------------------------------------------
    // 2. Only the student who owns this project can
    //    mark the feedback thread as read.
    // ---------------------------------------------------------
    if (project.StudentId != userId)
    {
        throw new UnauthorizedAccessException(
            "You can only mark your own feedback as read");
    }

    // ---------------------------------------------------------
    // 3. Get all comments belonging to this feedback thread
    // ---------------------------------------------------------
    var threadComments = await _context.Set<ChapterComment>()
        .Where(c =>
            c.ChapterId == chapterId &&
            c.FeedbackThreadId == threadId &&
            !c.IsDeleted)
        .ToListAsync();

    if (threadComments.Count == 0)
    {
        throw new KeyNotFoundException(
            "Feedback thread not found");
    }

    // ---------------------------------------------------------
    // 4. Find the guide assigned to this project
    // ---------------------------------------------------------

    // First: canonical active project allocation
    var allocationGuideId = await _context.Set<ProjectAllocation>()
        .AsNoTracking()
        .Where(a =>
            !a.IsDeleted &&
            a.Status == AllocationStatus.Active &&
            a.StudentId == project.StudentId)
        .OrderByDescending(a => a.AllocatedAt)
        .Select(a => (Guid?)a.GuideId)
        .FirstOrDefaultAsync();

    // Fallback: StudentProfile.GuideId
    var profileGuideId = await _context.Set<StudentProfile>()
        .AsNoTracking()
        .Where(s =>
            s.UserId == project.StudentId &&
            !s.IsDeleted)
        .Select(s => s.GuideId)
        .FirstOrDefaultAsync();

    var effectiveGuideId =
        allocationGuideId ?? profileGuideId;

    if (!effectiveGuideId.HasValue)
    {
        throw new InvalidOperationException(
            "Guide not assigned to this project");
    }

    // ---------------------------------------------------------
    // 5. Mark ONLY Guide comments in this thread as read
    // ---------------------------------------------------------
    foreach (var comment in threadComments)
    {
        if (comment.UserId == effectiveGuideId.Value)
        {
            comment.IsRead = true;
        }
    }

    // ---------------------------------------------------------
    // 6. Persist IsRead = true to database
    // ---------------------------------------------------------
    await _context.SaveChangesAsync();
}

    public async Task<ChapterCommentResponse> ResolveCommentAsync(
    Guid commentId,
    Guid userId)
{
    var comment = await _context.Set<ChapterComment>()
        .Include(c => c.Chapter)
        .FirstOrDefaultAsync(c =>
            c.Id == commentId &&
            !c.IsDeleted);

    if (comment == null)
        throw new KeyNotFoundException("Comment not found");

    // Only root Guide feedback can be approved.
    if (comment.ParentCommentId.HasValue)
    {
        throw new InvalidOperationException(
            "Only an original guide feedback comment can be resolved");
    }

    // Load the project through the chapter.
    var project = await _context.Set<Project>()
        .AsNoTracking()
        .FirstOrDefaultAsync(p =>
            p.Id == comment.Chapter.ProjectId &&
            !p.IsDeleted);

    if (project == null)
        throw new KeyNotFoundException("Project not found");

    // Check canonical active guide assignment.
    var allocationGuideId = await _context.Set<ProjectAllocation>()
        .AsNoTracking()
        .Where(a =>
            !a.IsDeleted &&
            a.Status == AllocationStatus.Active &&
            a.StudentId == project.StudentId)
        .OrderByDescending(a => a.AllocatedAt)
        .Select(a => (Guid?)a.GuideId)
        .FirstOrDefaultAsync();

    // Fallback to StudentProfile.GuideId.
    var profileGuideId = await _context.Set<StudentProfile>()
        .AsNoTracking()
        .Where(s =>
            s.UserId == project.StudentId &&
            !s.IsDeleted)
        .Select(s => s.GuideId)
        .FirstOrDefaultAsync();

    var effectiveGuideId =
        allocationGuideId ?? profileGuideId;

    if (effectiveGuideId != userId)
    {
        throw new UnauthorizedAccessException(
            "You are not the assigned guide for this project");
    }

    // Only the guide who created the root feedback
    // can approve it.
    if (comment.UserId != userId)
    {
        throw new UnauthorizedAccessException(
            "Only the guide who created this feedback can resolve it");
    }

    // ---------------------------------------------------------
    // Resolve the ENTIRE feedback thread.
    // ---------------------------------------------------------

    if (!comment.FeedbackThreadId.HasValue)
    {
        throw new InvalidOperationException(
            "Feedback thread not found for this comment");
    }

    var threadComments = await _context.Set<ChapterComment>()
        .Where(c =>
            c.FeedbackThreadId ==
                comment.FeedbackThreadId.Value &&
            !c.IsDeleted)
        .ToListAsync();

    foreach (var threadComment in threadComments)
    {
        threadComment.IsResolved = true;
    }

    await _context.SaveChangesAsync();

    await _context.Entry(comment)
        .Reference(c => c.User)
        .LoadAsync();

    return _mapper.Map<ChapterCommentResponse>(comment);
}

    public async Task DeleteCommentAsync(
        Guid commentId,
        Guid userId)
    {
        var comment = await _context.Set<ChapterComment>()
            .FirstOrDefaultAsync(c =>
                c.Id == commentId &&
                !c.IsDeleted);

        if (comment == null)
            throw new KeyNotFoundException("Comment not found");

        if (comment.UserId != userId)
        {
            throw new UnauthorizedAccessException(
                "You can only delete your own comments");
        }

        comment.IsDeleted = true;

        await _context.SaveChangesAsync();
    }
    
}