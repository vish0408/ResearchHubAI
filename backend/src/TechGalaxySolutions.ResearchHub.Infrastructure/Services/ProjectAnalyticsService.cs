using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Dashboard;
using TechGalaxySolutions.ResearchHub.Application.DTOs.DepartmentAnnouncement;
using TechGalaxySolutions.ResearchHub.Application.DTOs.GuideDashboard;
using TechGalaxySolutions.ResearchHub.Application.DTOs.HodDashboard;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Notification;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class ProjectAnalyticsService : IProjectAnalyticsService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ProjectAnalyticsService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<DashboardResponse> GetStudentDashboardAsync(Guid userId)
    {
        var project = await _context.Projects.AsNoTracking()
            .Where(p => p.StudentId == userId && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                Project = p,
                UpcomingMilestones = p.Milestones
                    .Where(m => !m.IsCompleted && !m.IsDeleted)
                    .OrderBy(m => m.TargetDate)
                    .Take(5)
                    .ToList(),
                RecentDocuments = p.Documents
                    .Where(d => !d.IsDeleted)
                    .OrderByDescending(d => d.UploadedAt)
                    .Take(5)
                    .ToList(),
                PendingTasks = p.Tasks.Count(t => !t.IsDeleted && t.Status != TaskItemStatus.Completed),
                CompletedTasks = p.Tasks.Count(t => !t.IsDeleted && t.Status == TaskItemStatus.Completed),
            })
            .FirstOrDefaultAsync();

        var notifications = await _context.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsDeleted)
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .ToListAsync();

        var response = new DashboardResponse();

        if (project != null)
        {
            response.CurrentProject = _mapper.Map<ProjectSummary>(project.Project);
            response.CompletionPercentage = (int)project.Project.CompletionPercentage;
            response.PendingTasks = project.PendingTasks;
            response.CompletedTasks = project.CompletedTasks;
            response.UpcomingMilestones = _mapper.Map<List<MilestoneSummary>>(project.UpcomingMilestones);
            response.RecentDocuments = _mapper.Map<List<DocumentSummary>>(project.RecentDocuments);
        }

        response.Notifications = _mapper.Map<List<NotificationResponse>>(notifications);

        var profile = await _context.Set<StudentProfile>().AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);
        if (profile != null)
        {
            var stageName = profile.ResearchStageId.HasValue
                ? await _context.Set<ResearchStage>().AsNoTracking()
                    .Where(rs => rs.Id == profile.ResearchStageId.Value && !rs.IsDeleted)
                    .Select(rs => rs.Name)
                    .FirstOrDefaultAsync()
                : null;

            var coursework = await _context.Set<ScholarCoursework>().AsNoTracking()
                .Where(c => c.StudentProfileId == profile.Id && !c.IsDeleted)
                .ToListAsync();

            var earned = coursework.Where(UserManagementService.IsCourseworkPassed).Sum(c => c.Credits);
            var required = profile.RequiredCredits ?? 0;

            response.JoiningCohort = profile.JoiningCohort;
            response.ResearchStageName = stageName;
            response.RequiredCredits = profile.RequiredCredits;
            response.EarnedCredits = earned;
            response.PassedPapers = coursework.Count(UserManagementService.IsCourseworkPassed);
            response.PendingPapers = coursework.Count(c => !UserManagementService.IsCourseworkPassed(c) && !c.IsCompleted);
            response.CourseworkStatus = UserManagementService.DeriveCourseworkStatus(profile.RequiredCredits, earned, coursework);
            response.CourseworkCompletionPercentage = required > 0
                ? Math.Round((decimal)earned / required * 100, 0)
                : (coursework.Count > 0 ? 100m : 0m);
        }

        return response;
    }

    public async Task<GuideDashboardResponse> GetGuideDashboardAsync(Guid userId)
    {
        // Canonical assignments live in ProjectAllocation (Active). StudentProfile.GuideId is a
        // denormalized mirror, so resolve the effective guide = latest active allocation ?? profile.
        var profileGuidedIds = await _context.Set<StudentProfile>().AsNoTracking()
            .Where(s => s.GuideId == userId && !s.IsDeleted)
            .Select(s => s.UserId)
            .ToListAsync();

        var allocationGuidedIds = await _context.Set<ProjectAllocation>().AsNoTracking()
            .Where(a => !a.IsDeleted
                && a.Status == AllocationStatus.Active
                && a.GuideId == userId)
            .Select(a => a.StudentId)
            .ToListAsync();

        var candidateStudentIds = profileGuidedIds.Union(allocationGuidedIds).ToList();

        var candidateProfiles = await _context.Set<StudentProfile>().AsNoTracking()
            .Include(s => s.User)
            .Where(s => candidateStudentIds.Contains(s.UserId) && !s.IsDeleted)
            .ToListAsync();

        var activeAllocations = await _context.Set<ProjectAllocation>().AsNoTracking()
            .Where(a => !a.IsDeleted
                && a.Status == AllocationStatus.Active
                && candidateStudentIds.Contains(a.StudentId))
            .OrderByDescending(a => a.AllocatedAt)
            .ToListAsync();
        var allocationByStudent = activeAllocations.ToLookup(a => a.StudentId);

        var assignedStudents = candidateProfiles
            .Where(s =>
            {
                var allocation = allocationByStudent[s.UserId].FirstOrDefault();
                var effectiveGuideId = allocation?.GuideId ?? s.GuideId;
                return effectiveGuideId == userId;
            })
            .ToList();

        var studentUserIds = assignedStudents.Select(s => s.UserId).ToList();

        var projects = await _context.Projects.AsNoTracking()
            .Include(p => p.Student)
            .Where(p => studentUserIds.Contains(p.StudentId) && !p.IsDeleted)
            .ToListAsync();

        var projectIds = projects.Select(p => p.Id).ToList();

        var pendingReviews = await _context.Set<Review>().AsNoTracking()
            .Include(r => r.Project)
            .Include(r => r.Project.Student)
            .Where(r => r.GuideId == userId && r.Status == ReviewStatus.Pending && !r.IsDeleted)
            .ToListAsync();

        var upcomingMeetings = await _context.Set<Meeting>().AsNoTracking()
            .Include(m => m.Participants).ThenInclude(p => p.User)
            .Where(m => m.GuideId == userId && m.Status == MeetingStatus.Scheduled && m.ScheduledAt > DateTime.UtcNow && !m.IsDeleted)
            .OrderBy(m => m.ScheduledAt)
            .Take(5)
            .ToListAsync();

        var recentNotifications = await _context.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsDeleted)
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .ToListAsync();

        var thesisDocs = await _context.ProjectDocuments.AsNoTracking()
            .Include(d => d.Project).ThenInclude(p => p.Student)
            .Include(d => d.Uploader)
            .Where(d => !d.IsDeleted && studentUserIds.Contains(d.UploaderId))
            .OrderByDescending(d => d.UploadedAt)
            .Take(20)
            .ToListAsync();

        var thesisDocIds = thesisDocs.Select(d => d.Id).ToList();
        var thesisReviews = await _context.Set<DocumentReview>().AsNoTracking()
            .Where(r => thesisDocIds.Contains(r.DocumentId) && r.GuideId == userId && !r.IsDeleted)
            .GroupBy(r => r.DocumentId)
            .ToDictionaryAsync(g => g.Key, g => g.OrderByDescending(r => r.CreatedAt).FirstOrDefault());

        var thesisProfileIds = thesisDocs.Select(d => d.UploaderId).Distinct().ToList();
        var thesisProfiles = await _context.Set<StudentProfile>().AsNoTracking()
            .Where(s => thesisProfileIds.Contains(s.UserId) && !s.IsDeleted)
            .ToDictionaryAsync(s => s.UserId);

        var assignedStudentIds = assignedStudents.Select(s => s.Id).ToList();
        var courseworkForAssigned = await _context.Set<ScholarCoursework>().AsNoTracking()
            .Where(c => !c.IsDeleted && assignedStudentIds.Contains(c.StudentProfileId))
            .ToListAsync();
        var courseworkLookup = courseworkForAssigned.ToLookup(c => c.StudentProfileId);

        var stageIds = assignedStudents.Where(s => s.ResearchStageId.HasValue).Select(s => s.ResearchStageId!.Value).Distinct().ToList();
        var stageNames = new Dictionary<Guid, string>();
        if (stageIds.Count > 0)
        {
            stageNames = await _context.Set<ResearchStage>().AsNoTracking()
                .Where(rs => stageIds.Contains(rs.Id))
                .ToDictionaryAsync(rs => rs.Id, rs => rs.Name);
        }

        var pendingThesisReviews = new List<ThesisDocumentSummary>();
        foreach (var doc in thesisDocs)
        {
            var exists = thesisReviews.TryGetValue(doc.Id, out var review);
            pendingThesisReviews.Add(new ThesisDocumentSummary
            {
                DocumentId = doc.Id,
                ProjectId = doc.ProjectId,
                ProjectTitle = doc.Project.Title,
                FileName = doc.FileName,
                FileType = doc.FileType,
                FileSize = doc.FileSize,
                UploadedAt = doc.UploadedAt,
                StudentId = doc.UploaderId,
                StudentName = doc.Project.Student?.FullName ?? doc.Uploader.FullName,
                Enrollment = thesisProfiles.GetValueOrDefault(doc.UploaderId)?.Enrollment ?? "",
                Department = thesisProfiles.GetValueOrDefault(doc.UploaderId)?.Department ?? "",
                ResearchTopic = thesisProfiles.GetValueOrDefault(doc.UploaderId)?.ResearchTopic ?? "",
                ReviewStatus = review?.Status,
                Version = 1,
            });
        }

        return new GuideDashboardResponse
        {
            TotalAssignedStudents = assignedStudents.Count,
            ProjectsUnderReview = projects.Count(p => p.Status == ProjectStatus.InProgress),
            PendingReviews = pendingReviews.Count,
            UpcomingMeetings = upcomingMeetings.Count,
            AssignedStudents = assignedStudents.Select(s =>
{
    var studentProjects = projects
        .Where(p => p.StudentId == s.UserId)
        .OrderByDescending(p => p.CreatedAt)
        .ToList();

    var coursework = courseworkLookup[s.Id].ToList();

    var earned = coursework
        .Where(UserManagementService.IsCourseworkPassed)
        .Sum(c => c.Credits);

    return new AssignedStudentSummary
    {
        UserId = s.UserId,
        ProjectId = studentProjects.FirstOrDefault()?.Id,

        FullName = s.User.FullName,
        Email = s.User.Email,
        Enrollment = s.Enrollment,
        Department = s.Department,
        ResearchTopic = s.ResearchTopic ?? string.Empty,

        ProjectTitle = studentProjects.FirstOrDefault()?.Title,
        ProjectStatus = studentProjects.FirstOrDefault()?.Status.ToString(),
        CompletionPercentage =
            studentProjects.FirstOrDefault()?.CompletionPercentage ?? 0,

        JoiningCohort = s.JoiningCohort,

        ResearchStageName =
            s.ResearchStageId.HasValue &&
            stageNames.TryGetValue(
                s.ResearchStageId.Value,
                out var sn)
                ? sn
                : null,

        RequiredCredits = s.RequiredCredits,
        EarnedCredits = earned,

        PendingPapers = coursework.Count(c =>
            !UserManagementService.IsCourseworkPassed(c) &&
            !c.IsCompleted),

        CourseworkStatus =
            UserManagementService.DeriveCourseworkStatus(
                s.RequiredCredits,
                earned,
                coursework)
    };
}).ToList(),




            PendingReviewList = pendingReviews.Select(r => new PendingReviewSummary
            {
                ProjectId = r.ProjectId,
                ProjectTitle = r.Project.Title,
                StudentName = r.Project.Student?.FullName ?? "Unknown",
                ReviewId = r.Id,
                Type = "Project Review",
                SubmittedAt = r.CreatedAt,
            }).ToList(),
            UpcomingMeetingsList = upcomingMeetings.Select(m => new UpcomingMeetingSummary
            {
                MeetingId = m.Id,
                Title = m.Title,
                ScheduledAt = m.ScheduledAt,
                DurationMinutes = m.DurationMinutes,
                MeetingLink = m.MeetingLink,
                Status = m.Status.ToString(),
            }).ToList(),
            RecentNotifications = _mapper.Map<List<NotificationResponse>>(recentNotifications),
            PendingThesisReviews = pendingThesisReviews,
        };
    }

    public async Task<HodDashboardResponse> GetHodDashboardAsync(Guid userId)
    {
        var hod = await _context.Set<Hod>().AsNoTracking()
            .Include(h => h.User)
            .Include(h => h.Department)
            .Include(h => h.College)
            .FirstOrDefaultAsync(h => h.UserId == userId && !h.IsDeleted)
            ?? throw new UnauthorizedAccessException("HOD profile not found");

        var collegeId = hod.CollegeId;
        var departmentId = hod.DepartmentId;

        // Scholars = activated, active users belonging to this HOD's college + department.
        var scholarUserIds = await _context.Set<StudentProfile>().AsNoTracking()
            .Where(s => !s.IsDeleted
                && s.User.CollegeId == collegeId
                && s.User.DepartmentId == departmentId
                && s.User.Status == "Active"
                && s.User.ActivatedAt != null)
            .Select(s => s.UserId)
            .ToListAsync();

        var deptStudents = await _context.Set<StudentProfile>().AsNoTracking()
            .Where(s => !s.IsDeleted && scholarUserIds.Contains(s.UserId))
            .Select(s => new
            {
                s.Id,
                s.UserId,
                s.GuideId,
                s.ResearchStageId,
                s.RequiredCredits,
                ScholarName = s.User.FullName
            })
            .ToListAsync();

        // Guides = active users with a guide profile in this HOD's college + department.
        var guides = await _context.Set<GuideProfile>().AsNoTracking()
            .Where(g => !g.IsDeleted
                && g.User.CollegeId == collegeId
                && g.User.DepartmentId == departmentId
                && g.User.Status == "Active")
            .Select(g => new { g.UserId, g.User.FullName })
            .ToListAsync();
        var guideUserIds = guides.Select(g => g.UserId).ToList();

        var projects = await _context.Projects.AsNoTracking()
            .Where(p => !p.IsDeleted && scholarUserIds.Contains(p.StudentId))
            .Select(p => new
            {
                p.Id,
                p.StudentId,
                p.Title,
                p.Status,
                p.CompletionPercentage,
                p.CreatedAt,
                p.TargetEndDate
            })
            .ToListAsync();
        var projectIds = projects.Select(p => p.Id).ToList();

        var activeProjects = projects.Count(p => p.Status == ProjectStatus.InProgress);
        var completedProjects = projects.Count(p => p.Status == ProjectStatus.Completed);

        var pendingReviews = projectIds.Count > 0
            ? await _context.Set<Review>().AsNoTracking()
                .CountAsync(r => !r.IsDeleted && r.Status == ReviewStatus.Pending && projectIds.Contains(r.ProjectId))
            : 0;

        var meetingsScheduled = guideUserIds.Count > 0
            ? await _context.Set<Meeting>().AsNoTracking()
                .CountAsync(m => !m.IsDeleted && m.Status == MeetingStatus.Scheduled && guideUserIds.Contains(m.GuideId))
            : 0;

        var topicsCount = await _context.Set<ResearchTopic>().AsNoTracking()
            .CountAsync(t => !t.IsDeleted && t.DepartmentId == departmentId);
        var activeTopics = await _context.Set<ResearchTopic>().AsNoTracking()
            .CountAsync(t => !t.IsDeleted && t.IsActive && t.DepartmentId == departmentId);
        var categoriesCount = await _context.Set<ResearchCategory>().AsNoTracking()
            .CountAsync(c => !c.IsDeleted);
        var allocationsCount = scholarUserIds.Count > 0
            ? await _context.Set<ProjectAllocation>().AsNoTracking()
                .CountAsync(a => !a.IsDeleted && a.Status == AllocationStatus.Active && scholarUserIds.Contains(a.StudentId))
            : 0;

        var approvalStats = guideUserIds.Count > 0
            ? await _context.Set<ApprovalHistory>().AsNoTracking()
                .Where(a => !a.IsDeleted && guideUserIds.Contains(a.GuideId))
                .GroupBy(a => a.Action)
                .Select(g => new ApprovalActionCount(g.Key, g.Count()))
                .ToListAsync()
            : new List<ApprovalActionCount>();

        var recentActivities = guideUserIds.Count > 0
            ? await _context.Set<ApprovalHistory>().AsNoTracking()
                .Include(a => a.Guide)
                .Where(a => !a.IsDeleted && guideUserIds.Contains(a.GuideId))
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .Select(a => new ActivityTimelineItem
                {
                    Id = a.Id.ToString(),
                    Action = a.Action.ToString(),
                    Description = string.IsNullOrEmpty(a.Comments) ? "No details" : a.Comments,
                    UserName = a.Guide != null ? a.Guide.FullName : "System",
                    Timestamp = a.CreatedAt,
                    Type = "Approval"
                })
                .ToListAsync()
            : new List<ActivityTimelineItem>();

        var upcomingMeetings = guideUserIds.Count > 0
            ? await _context.Set<Meeting>().AsNoTracking()
                .Include(m => m.Guide)
                .Where(m => !m.IsDeleted && m.Status == MeetingStatus.Scheduled && m.ScheduledAt >= DateTime.UtcNow && guideUserIds.Contains(m.GuideId))
                .OrderBy(m => m.ScheduledAt)
                .Take(5)
                .Select(m => new UpcomingMeetingItem
                {
                    Id = m.Id,
                    Title = m.Title,
                    ScheduledAt = m.ScheduledAt,
                    DurationMinutes = m.DurationMinutes,
                    Status = m.Status.ToString(),
                    GuideName = m.Guide != null ? m.Guide.FullName : ""
                })
                .ToListAsync()
            : new List<UpcomingMeetingItem>();

        var notifications = await _context.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsDeleted)
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .ToListAsync();

        var announcements = await _context.Set<DepartmentAnnouncement>().AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Where(a => a.DepartmentProfileId == departmentId && !a.IsDeleted && a.Status == AnnouncementStatus.Published)
            .OrderByDescending(a => a.PublishedAt)
            .Take(5)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var sixMonthsAgo = now.AddMonths(-6);
        var monthlyActivity = scholarUserIds.Count > 0
            ? await _context.Projects.AsNoTracking()
                .Where(p => !p.IsDeleted && scholarUserIds.Contains(p.StudentId) && p.CreatedAt >= sixMonthsAgo)
                .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
                .Select(g => new MonthCount(g.Key.Year, g.Key.Month, g.Count()))
                .ToListAsync()
            : new List<MonthCount>();

        // "Pending Topic Approvals": ResearchTopic has no approval/status workflow today, so report 0 honestly.
        var pendingTopicApprovals = 0;
        var pendingProposalApprovals = scholarUserIds.Count > 0
            ? await _context.Set<AIProposal>().AsNoTracking()
                .CountAsync(p => !p.IsDeleted && scholarUserIds.Contains(p.StudentId) && (string.IsNullOrEmpty(p.Status) || p.Status == "Pending"))
            : 0;

        var upcomingDeadlines = projects.Count(p =>
            p.TargetEndDate.HasValue &&
            p.TargetEndDate.Value > now &&
            p.TargetEndDate.Value <= now.AddDays(30) &&
            p.Status != ProjectStatus.Completed);

        var monthLabels = new List<string>();
        var monthData = new List<int>();
        for (int i = 5; i >= 0; i--)
        {
            var dt = now.AddMonths(-i);
            monthLabels.Add(dt.ToString("MMM yyyy"));
            monthData.Add(monthlyActivity.FirstOrDefault(m => m.Year == dt.Year && m.Month == dt.Month)?.Count ?? 0);
        }

        // Scholar stage distribution built from ResearchStages master data (only populated buckets).
        var stages = await _context.Set<ResearchStage>().AsNoTracking()
            .Where(rs => !rs.IsDeleted && rs.IsActive)
            .OrderBy(rs => rs.SortOrder)
            .Select(rs => new { rs.Id, rs.Name })
            .ToListAsync();

        var stageNameById = stages.ToDictionary(s => s.Id, s => s.Name);
        var stageCounts = deptStudents
            .Where(s => s.ResearchStageId.HasValue)
            .GroupBy(s => s.ResearchStageId!.Value)
            .ToDictionary(g => g.Key, g => g.Count());
        var unassignedStageCount = deptStudents.Count(s => !s.ResearchStageId.HasValue);

        var stagePalette = new[]
        {
            "#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#22c55e", "#ef4444",
            "#0ea5e9", "#ec4899", "#14b8a6", "#f97316", "#84cc16"
        };
        var stageLabels = new List<string>();
        var stageData = new List<int>();
        var stageColors = new List<string>();
        var colorIdx = 0;
        foreach (var st in stages)
        {
            if (stageCounts.TryGetValue(st.Id, out var c) && c > 0)
            {
                stageLabels.Add(st.Name);
                stageData.Add(c);
                stageColors.Add(stagePalette[colorIdx % stagePalette.Length]);
                colorIdx++;
            }
        }
        if (unassignedStageCount > 0)
        {
            stageLabels.Add("Not Assigned");
            stageData.Add(unassignedStageCount);
            stageColors.Add("#64748b");
        }

        // Research status distribution - only statuses actually present.
        var statusCounts = projects.GroupBy(p => p.Status).ToDictionary(g => g.Key, g => g.Count());
        var researchStatusLabels = new List<string>();
        var researchStatusData = new List<int>();
        var researchStatusColors = new List<string>();
        foreach (var st in new[] { ProjectStatus.NotStarted, ProjectStatus.InProgress, ProjectStatus.OnHold, ProjectStatus.Completed })
        {
            if (statusCounts.TryGetValue(st, out var c) && c > 0)
            {
                researchStatusLabels.Add(ProjectStatusLabel(st));
                researchStatusData.Add(c);
                researchStatusColors.Add(st switch
                {
                    ProjectStatus.NotStarted => "#a855f7",
                    ProjectStatus.InProgress => "#3b82f6",
                    ProjectStatus.OnHold => "#f59e0b",
                    ProjectStatus.Completed => "#22c55e",
                    _ => "#6b7280"
                });
            }
        }

        // Guide workload - guides with at least one assigned scholar.
        var assignedPerGuide = deptStudents
            .Where(s => s.GuideId.HasValue && guideUserIds.Contains(s.GuideId.Value))
            .GroupBy(s => s.GuideId!.Value)
            .ToDictionary(g => g.Key, g => g.Count());
        var assignedGuideCount = assignedPerGuide.Count;
        var topGuides = guides
            .Select(g => new { g.FullName, Count = assignedPerGuide.GetValueOrDefault(g.UserId, 0) })
            .Where(g => g.Count > 0)
            .OrderByDescending(g => g.Count)
            .Take(10)
            .ToList();

        var approved = approvalStats.FirstOrDefault(a => a.Action == ApprovalAction.Approved)?.Count ?? 0;
        var rejected = approvalStats.FirstOrDefault(a => a.Action == ApprovalAction.Rejected)?.Count ?? 0;
        var pendingApprovals = approvalStats.FirstOrDefault(a => a.Action == ApprovalAction.Submitted)?.Count ?? 0;
        var approvalLabels = new List<string>();
        var approvalData = new List<int>();
        var approvalColors = new List<string>();
        foreach (var (label, count, color) in new[]
        {
            ("Approved", approved, "#22c55e"),
            ("Rejected", rejected, "#ef4444"),
            ("Pending", pendingApprovals, "#f59e0b")
        })
        {
            if (count > 0)
            {
                approvalLabels.Add(label);
                approvalData.Add(count);
                approvalColors.Add(color);
            }
        }

        // Scholar stage-based milestones and coursework metrics.
        var deptStudentProfileIds = deptStudents.Select(s => s.Id).ToList();
        var coursework = deptStudentProfileIds.Count > 0
            ? await _context.Set<ScholarCoursework>().AsNoTracking()
                .Where(c => !c.IsDeleted && deptStudentProfileIds.Contains(c.StudentProfileId))
                .ToListAsync()
            : new List<ScholarCoursework>();
        var courseworkLookup = coursework.ToLookup(c => c.StudentProfileId);

        var researchInProgress = 0;
        var thesisSubmitted = 0;
        var completedScholars = 0;
        var courseworkInProgress = 0;
        var courseworkCompleted = 0;

        foreach (var student in deptStudents)
        {
            var stageName = student.ResearchStageId.HasValue
                ? stageNameById.GetValueOrDefault(student.ResearchStageId.Value, string.Empty)
                : string.Empty;
            if (stageName == "Research in Progress") researchInProgress++;
            if (stageName == "Thesis Submitted" || stageName == "Viva") thesisSubmitted++;
            if (stageName == "Completed") completedScholars++;

            var studentCoursework = courseworkLookup[student.Id].ToList();
            var earned = studentCoursework.Where(UserManagementService.IsCourseworkPassed).Sum(c => c.Credits);
            var status = UserManagementService.DeriveCourseworkStatus(student.RequiredCredits, earned, studentCoursework);
            if (status == "Completed" || status == "Eligible for Completion")
                courseworkCompleted++;
            else if (status == "In Progress" || status == "Not Started")
                courseworkInProgress++;
        }

        var scholarNameById = deptStudents.ToDictionary(s => s.UserId, s => s.ScholarName);
        var recentSubmissions = projects
            .OrderByDescending(p => p.CreatedAt)
            .Take(10)
            .Select(p => new RecentSubmissionItem
            {
                Id = p.Id,
                StudentName = scholarNameById.GetValueOrDefault(p.StudentId) ?? "Unknown",
                SubmissionType = "Project",
                Title = p.Title,
                SubmittedAt = p.CreatedAt,
                Status = p.Status.ToString()
            })
            .ToList();

        return new HodDashboardResponse
        {
            HodName = hod.User.FullName,
            DepartmentName = hod.Department.DepartmentName,
            CollegeName = hod.College.Name,

            TotalScholars = deptStudents.Count,
            ActiveResearchProjects = activeProjects,
            PendingTopicApprovals = pendingTopicApprovals,
            PendingProposalApprovals = pendingProposalApprovals,
            AssignedGuides = assignedGuideCount,
            MeetingsScheduled = meetingsScheduled,
            CompletedResearch = completedProjects,
            // HOD manages their own department.
            DepartmentsManaged = 1,
            Notifications = notifications.Count,
            UpcomingDeadlines = upcomingDeadlines,

            TotalGuides = guides.Count,
            ActiveProjects = activeProjects,
            CompletedProjects = completedProjects,
            PendingReviews = pendingReviews,

            CourseworkInProgress = courseworkInProgress,
            CourseworkCompleted = courseworkCompleted,
            ResearchInProgress = researchInProgress,
            ThesisSubmitted = thesisSubmitted,
            CompletedScholars = completedScholars,

            ResearchStats = new ResearchStatistics
            {
                TotalResearchTopics = topicsCount,
                ActiveTopics = activeTopics,
                TotalCategories = categoriesCount,
                AllocatedProjects = allocationsCount,
            },

            Announcements = _mapper.Map<List<DepartmentAnnouncementResponse>>(announcements),
            RecentNotifications = _mapper.Map<List<NotificationResponse>>(notifications),

            StudentProgressChart = new ChartData
            {
                Labels = stageLabels,
                Data = stageData,
                Colors = stageColors
            },
            ResearchStatusChart = new ChartData
            {
                Labels = researchStatusLabels,
                Data = researchStatusData,
                Colors = researchStatusColors
            },
            GuideWorkloadChart = new ChartData
            {
                Labels = topGuides.Select(g => g.FullName).ToList(),
                Data = topGuides.Select(g => g.Count).ToList(),
                Colors = topGuides.Select((_, i) => $"hsl({(i * 35) % 360}, 70%, 50%)").ToList()
            },
            MonthlyActivityChart = new ChartData
            {
                Labels = monthLabels,
                Data = monthData,
                Colors = Enumerable.Repeat("#3b82f6", 6).ToList()
            },
            ApprovalStatisticsChart = new ChartData
            {
                Labels = approvalLabels,
                Data = approvalData,
                Colors = approvalColors
            },

            RecentActivity = recentActivities,
            UpcomingMeetings = upcomingMeetings,
            RecentSubmissions = recentSubmissions,
        };
    }

    private static string ProjectStatusLabel(ProjectStatus status) => status switch
    {
        ProjectStatus.NotStarted => "Not Started",
        ProjectStatus.InProgress => "In Progress",
        ProjectStatus.OnHold => "On Hold",
        ProjectStatus.Completed => "Completed",
        _ => status.ToString()
    };

    private sealed record ApprovalActionCount(ApprovalAction Action, int Count);

    private sealed record MonthCount(int Year, int Month, int Count);
}
