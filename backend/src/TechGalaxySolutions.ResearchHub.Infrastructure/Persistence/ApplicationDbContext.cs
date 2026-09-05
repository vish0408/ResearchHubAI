using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Domain.Entities;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<TaskItem> TaskItems => Set<TaskItem>();
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<ProjectDocument> ProjectDocuments => Set<ProjectDocument>();
    public DbSet<Domain.Entities.Notification> Notifications => Set<Domain.Entities.Notification>();
    public DbSet<GuideProfile> GuideProfiles => Set<GuideProfile>();
    public DbSet<Domain.Entities.Review> Reviews => Set<Domain.Entities.Review>();
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<ChapterVersion> ChapterVersions { get; set; }
    public DbSet<ChapterComment> ChapterComments => Set<ChapterComment>();
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<MeetingParticipant> MeetingParticipants => Set<MeetingParticipant>();
    public DbSet<ApprovalHistory> ApprovalHistories => Set<ApprovalHistory>();
    public DbSet<DepartmentProfile> DepartmentProfiles => Set<DepartmentProfile>();
    public DbSet<DepartmentSettings> DepartmentSettings => Set<DepartmentSettings>();
    public DbSet<ResearchCategory> ResearchCategories => Set<ResearchCategory>();
    public DbSet<ResearchTopic> ResearchTopics => Set<ResearchTopic>();
    public DbSet<ProjectAllocation> ProjectAllocations => Set<ProjectAllocation>();
    public DbSet<DepartmentAnnouncement> DepartmentAnnouncements => Set<DepartmentAnnouncement>();
    public DbSet<DepartmentReport> DepartmentReports => Set<DepartmentReport>();
    public DbSet<College> Colleges => Set<College>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<Semester> Semesters => Set<Semester>();
    public DbSet<FacultyMember> FacultyMembers => Set<FacultyMember>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<GlobalAnnouncement> GlobalAnnouncements => Set<GlobalAnnouncement>();
    public DbSet<BackupRecord> BackupRecords => Set<BackupRecord>();
    public DbSet<AIProposal> AIProposals => Set<AIProposal>();
    public DbSet<LiteratureReview> LiteratureReviews => Set<LiteratureReview>();
    public DbSet<UploadedDocument> UploadedDocuments => Set<UploadedDocument>();
    public DbSet<DocumentChunk> DocumentChunks => Set<DocumentChunk>();
    public DbSet<AnalysisHistory> AnalysisHistories => Set<AnalysisHistory>();
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<Citation> Citations => Set<Citation>();
    public DbSet<DocumentReference> DocumentReferences => Set<DocumentReference>();
    public DbSet<ConversationMemory> ConversationMemories => Set<ConversationMemory>();
    public DbSet<DocumentReview> DocumentReviews => Set<DocumentReview>();
    public DbSet<DocumentComment> DocumentComments => Set<DocumentComment>();
    public DbSet<LoginHistory> LoginHistories => Set<LoginHistory>();
    public DbSet<EmailLog> EmailLogs => Set<EmailLog>();
    public DbSet<Hod> Hods => Set<Hod>();
    public DbSet<ResearchStage> ResearchStages => Set<ResearchStage>();
    public DbSet<ScholarCoursework> ScholarCoursework => Set<ScholarCoursework>();
    

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.HasOne(u => u.Role).WithMany(r => r.Users).HasForeignKey(u => u.RoleId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(u => u.CollegeEntity).WithMany().HasForeignKey(u => u.CollegeId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(u => u.DepartmentEntity).WithMany().HasForeignKey(u => u.DepartmentId).OnDelete(DeleteBehavior.NoAction);
            entity.Property<bool>("IsDeleted");
            entity.HasIndex("IsDeleted").HasDatabaseName("IX_Users_IsDeleted");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(rt => rt.Token).IsUnique();
            entity.HasOne(rt => rt.User).WithMany().HasForeignKey(rt => rt.UserId);
        });

        modelBuilder.Entity<StudentProfile>(entity =>
        {
            entity.HasIndex(sp => sp.UserId).IsUnique();
            entity.HasOne(sp => sp.User).WithMany().HasForeignKey(sp => sp.UserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(sp => sp.Guide).WithMany().HasForeignKey(sp => sp.GuideId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(sp => sp.AcademicYear).WithMany().HasForeignKey(sp => sp.AcademicYearId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(sp => sp.Semester).WithMany().HasForeignKey(sp => sp.SemesterId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(sp => sp.ResearchStage).WithMany(rs => rs.Students).HasForeignKey(sp => sp.ResearchStageId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(sp => sp.GuideId).HasDatabaseName("IX_StudentProfiles_GuideId");
            entity.HasIndex(sp => sp.ResearchStageId).HasDatabaseName("IX_StudentProfiles_ResearchStageId");
        });

        modelBuilder.Entity<ResearchStage>(entity =>
        {
            entity.HasIndex(rs => rs.Name).IsUnique();
            entity.HasIndex(rs => rs.SortOrder).HasDatabaseName("IX_ResearchStages_SortOrder");
        });

        modelBuilder.Entity<ScholarCoursework>(entity =>
        {
            entity.HasOne(c => c.StudentProfile).WithMany(sp => sp.Coursework).HasForeignKey(c => c.StudentProfileId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(c => c.StudentProfileId).HasDatabaseName("IX_ScholarCoursework_StudentProfileId");
            entity.HasIndex(c => new { c.StudentProfileId, c.PaperCode }).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(c => c.Marks).HasPrecision(5, 2);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasOne(p => p.Student).WithMany().HasForeignKey(p => p.StudentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(p => p.IsDeleted).HasDatabaseName("IX_Projects_IsDeleted");
            entity.HasIndex(p => p.StudentId).HasDatabaseName("IX_Projects_StudentId");
            entity.HasIndex(p => p.Status).HasDatabaseName("IX_Projects_Status");
            entity.HasIndex(p => new { p.StudentId, p.Status, p.IsDeleted }).HasDatabaseName("IX_Projects_StudentId_Status_IsDeleted");
        });

        modelBuilder.Entity<ProjectMember>(entity =>
        {
            entity.HasOne(pm => pm.Project).WithMany(p => p.Members).HasForeignKey(pm => pm.ProjectId);
            entity.HasOne(pm => pm.User).WithMany().HasForeignKey(pm => pm.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.HasOne(t => t.Project).WithMany(p => p.Tasks).HasForeignKey(t => t.ProjectId);
            entity.HasOne(t => t.AssignedTo).WithMany().HasForeignKey(t => t.AssignedToId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(t => t.ProjectId).HasDatabaseName("IX_TaskItems_ProjectId");
        });

        modelBuilder.Entity<Milestone>(entity =>
        {
            entity.HasOne(m => m.Project).WithMany(p => p.Milestones).HasForeignKey(m => m.ProjectId);
            entity.HasIndex(m => m.ProjectId).HasDatabaseName("IX_Milestones_ProjectId");
        });

        modelBuilder.Entity<ProjectDocument>(entity =>
        {
            entity.HasOne(d => d.Project).WithMany(p => p.Documents).HasForeignKey(d => d.ProjectId);
            entity.HasOne(d => d.Uploader).WithMany().HasForeignKey(d => d.UploaderId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(d => d.ProjectId).HasDatabaseName("IX_ProjectDocuments_ProjectId");
        });

        modelBuilder.Entity<Domain.Entities.Notification>(entity =>
        {
            entity.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(n => n.UserId);
        });

        modelBuilder.Entity<GuideProfile>(entity =>
        {
            entity.HasIndex(g => g.UserId).IsUnique();
            entity.HasOne(g => g.User).WithMany().HasForeignKey(g => g.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Domain.Entities.Review>(entity =>
        {
            entity.HasOne(r => r.Project).WithMany(p => p.Reviews).HasForeignKey(r => r.ProjectId);
            entity.HasOne(r => r.Guide).WithMany().HasForeignKey(r => r.GuideId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(r => r.ProjectId).HasDatabaseName("IX_Reviews_ProjectId");
            entity.HasIndex(r => r.GuideId).HasDatabaseName("IX_Reviews_GuideId");
            entity.HasIndex(r => r.Status).HasDatabaseName("IX_Reviews_Status");
        });

        modelBuilder.Entity<Chapter>(entity =>
        {
            entity.HasOne(c => c.Project).WithMany(p => p.Chapters).HasForeignKey(c => c.ProjectId);
            entity.HasIndex(c => c.ProjectId).HasDatabaseName("IX_Chapters_ProjectId");
        });

        modelBuilder.Entity<ChapterVersion>(entity =>
{
    entity.HasOne(cv => cv.Chapter)
        .WithMany(c => c.Versions)
        .HasForeignKey(cv => cv.ChapterId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.HasIndex(cv => cv.ChapterId)
        .HasDatabaseName("IX_ChapterVersions_ChapterId");

    entity.HasIndex(cv => new { cv.ChapterId, cv.VersionNumber })
        .IsUnique()
        .HasFilter("[IsDeleted] = 0")
        .HasDatabaseName("IX_ChapterVersions_ChapterId_VersionNumber");
});

        modelBuilder.Entity<ChapterComment>(entity =>
        {
            entity.HasOne(c => c.Chapter).WithMany(c => c.Comments).HasForeignKey(c => c.ChapterId);
            entity.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(cc => cc.ChapterId).HasDatabaseName("IX_ChapterComments_ChapterId");
        });

        modelBuilder.Entity<Meeting>(entity =>
        {
            entity.HasOne(m => m.Guide).WithMany().HasForeignKey(m => m.GuideId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(m => m.GuideId).HasDatabaseName("IX_Meetings_GuideId");
        });

        modelBuilder.Entity<MeetingParticipant>(entity =>
        {
            entity.HasOne(m => m.Meeting).WithMany(m => m.Participants).HasForeignKey(m => m.MeetingId);
            entity.HasOne(m => m.User).WithMany().HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ApprovalHistory>(entity =>
        {
            entity.HasOne(a => a.Project).WithMany().HasForeignKey(a => a.ProjectId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(a => a.Chapter).WithMany().HasForeignKey(a => a.ChapterId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(a => a.Guide).WithMany().HasForeignKey(a => a.GuideId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<DepartmentProfile>(entity =>
        {
            entity.HasIndex(d => d.DepartmentName).IsUnique();
            entity.HasOne(d => d.HodUser).WithMany().HasForeignKey(d => d.HodUserId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<DepartmentSettings>(entity =>
        {
            entity.HasOne(d => d.DepartmentProfile).WithMany().HasForeignKey(d => d.DepartmentProfileId);
        });

        modelBuilder.Entity<ResearchCategory>(entity =>
        {
            entity.HasOne(r => r.DepartmentProfile).WithMany().HasForeignKey(r => r.DepartmentProfileId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(r => new { r.Name, r.DisciplineGroup }).IsUnique().HasFilter("[IsDeleted] = 0").HasDatabaseName("IX_ResearchCategories_Name_DisciplineGroup");
            entity.HasIndex(r => r.Code).IsUnique().HasFilter("[IsDeleted] = 0 AND [Code] <> ''").HasDatabaseName("IX_ResearchCategories_Code");
            entity.HasIndex(r => r.DisciplineGroup).HasDatabaseName("IX_ResearchCategories_DisciplineGroup");
        });

        modelBuilder.Entity<ResearchTopic>(entity =>
        {
            entity.HasOne(r => r.Category).WithMany(c => c.ResearchTopics).HasForeignKey(r => r.CategoryId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(r => r.DepartmentProfile).WithMany().HasForeignKey(r => r.DepartmentProfileId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(r => r.Department).WithMany().HasForeignKey(r => r.DepartmentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(r => r.CreatedByUser).WithMany().HasForeignKey(r => r.CreatedByUserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(rt => rt.CategoryId).HasDatabaseName("IX_ResearchTopics_CategoryId");
            entity.HasIndex(rt => rt.DepartmentProfileId).HasDatabaseName("IX_ResearchTopics_DepartmentProfileId");
            entity.HasIndex(rt => rt.DepartmentId).HasDatabaseName("IX_ResearchTopics_DepartmentId");
        });

        modelBuilder.Entity<ProjectAllocation>(entity =>
        {
            entity.HasOne(a => a.Student).WithMany().HasForeignKey(a => a.StudentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(a => a.Guide).WithMany().HasForeignKey(a => a.GuideId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(a => a.Project).WithMany().HasForeignKey(a => a.ProjectId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(a => a.AllocatedByUser).WithMany().HasForeignKey(a => a.AllocatedByUserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(pa => pa.StudentId).HasDatabaseName("IX_ProjectAllocations_StudentId");
            entity.HasIndex(pa => pa.GuideId).HasDatabaseName("IX_ProjectAllocations_GuideId");
        });

        modelBuilder.Entity<DepartmentAnnouncement>(entity =>
        {
            entity.HasOne(a => a.DepartmentProfile).WithMany().HasForeignKey(a => a.DepartmentProfileId);
            entity.HasOne(a => a.CreatedByUser).WithMany().HasForeignKey(a => a.CreatedByUserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(da => da.DepartmentProfileId).HasDatabaseName("IX_DepartmentAnnouncements_DepartmentProfileId");
            entity.HasIndex(da => da.Status).HasDatabaseName("IX_DepartmentAnnouncements_Status");
        });

        modelBuilder.Entity<DepartmentReport>(entity =>
        {
            entity.HasOne(r => r.DepartmentProfile).WithMany().HasForeignKey(r => r.DepartmentProfileId);
            entity.HasOne(r => r.GeneratedByUser).WithMany().HasForeignKey(r => r.GeneratedByUserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(dr => dr.DepartmentProfileId).HasDatabaseName("IX_DepartmentReports_DepartmentProfileId");
        });

        modelBuilder.Entity<College>(entity =>
        {
            entity.HasIndex(c => c.Code).IsUnique().HasFilter("[IsDeleted] = 0");
        });

        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasIndex(d => d.DepartmentCode).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.HasOne(d => d.College).WithMany(c => c.Departments).HasForeignKey(d => d.CollegeId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(d => d.Hod).WithMany().HasForeignKey(d => d.HodId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AcademicYear>(entity =>
        {
            entity.HasIndex(a => a.Name).IsUnique();
        });

        modelBuilder.Entity<Semester>(entity =>
        {
            entity.HasOne(s => s.AcademicYear).WithMany(a => a.Semesters).HasForeignKey(s => s.AcademicYearId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<FacultyMember>(entity =>
        {
            entity.HasIndex(f => f.UserId).IsUnique();
            entity.HasOne(f => f.User).WithMany().HasForeignKey(f => f.UserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(f => f.Department).WithMany(d => d.FacultyMembers).HasForeignKey(f => f.DepartmentId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Hod>(entity =>
        {
            entity.HasIndex(h => h.UserId).IsUnique();
            entity.HasIndex(h => new { h.DepartmentId, h.IsActive }).HasFilter("[IsDeleted] = 0 AND [IsActive] = 1");
            entity.HasOne(h => h.User).WithMany().HasForeignKey(h => h.UserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(h => h.Department).WithMany().HasForeignKey(h => h.DepartmentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(h => h.College).WithMany().HasForeignKey(h => h.CollegeId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<SystemSetting>(entity =>
        {
            entity.HasIndex(s => s.Key).IsUnique();
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.SetNull);
            entity.Property(a => a.UserAgent).HasMaxLength(512);
            entity.HasIndex(a => a.Timestamp);
            entity.HasIndex(al => al.EntityName).HasDatabaseName("IX_AuditLogs_EntityName");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasIndex(p => p.Name).IsUnique();
        });

        modelBuilder.Entity<RolePermission>(entity =>
{
    entity.HasIndex(rp => new { rp.RoleId, rp.PermissionId }).IsUnique();

    entity.HasOne(rp => rp.Role)
        .WithMany(r => r.RolePermissions)
        .HasForeignKey(rp => rp.RoleId)
        .OnDelete(DeleteBehavior.NoAction);

    entity.HasOne(rp => rp.Permission)
        .WithMany()
        .HasForeignKey(rp => rp.PermissionId)
        .OnDelete(DeleteBehavior.NoAction);
});

        modelBuilder.Entity<GlobalAnnouncement>(entity =>
        {
            entity.HasOne(a => a.CreatedByUser).WithMany().HasForeignKey(a => a.CreatedByUserId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<BackupRecord>(entity =>
        {
            entity.HasOne(b => b.CreatedByUser).WithMany().HasForeignKey(b => b.CreatedByUserId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(b => b.Status);
            entity.HasIndex(b => b.CreatedAt);
        });

        modelBuilder.Entity<AIProposal>(entity =>
        {
            entity.HasOne(p => p.Student).WithMany().HasForeignKey(p => p.StudentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(p => p.StudentId);
        });

        modelBuilder.Entity<LiteratureReview>(entity =>
        {
            entity.HasOne(l => l.Student).WithMany().HasForeignKey(l => l.StudentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(l => l.StudentId);
        });

        modelBuilder.Entity<UploadedDocument>(entity =>
        {
            entity.HasOne(d => d.LiteratureReview).WithMany(l => l.Documents).HasForeignKey(d => d.LiteratureReviewId);
            entity.HasOne(d => d.UploadedByUser).WithMany().HasForeignKey(d => d.UploadedByUserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(d => d.LiteratureReviewId);
        });

        modelBuilder.Entity<DocumentChunk>(entity =>
        {
            entity.HasOne(c => c.UploadedDocument).WithMany().HasForeignKey(c => c.UploadedDocumentId);
            entity.HasIndex(c => c.UploadedDocumentId);
        });

        modelBuilder.Entity<AnalysisHistory>(entity =>
        {
            entity.HasOne(a => a.LiteratureReview).WithMany(l => l.AnalysisHistories).HasForeignKey(a => a.LiteratureReviewId);
            entity.HasIndex(a => a.LiteratureReviewId);
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.HasIndex(s => s.StudentId);
            entity.HasIndex(s => s.LastActivityAt);
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasOne(m => m.ChatSession).WithMany(s => s.Messages).HasForeignKey(m => m.ChatSessionId);
            entity.HasIndex(m => m.ChatSessionId);
            entity.HasIndex(m => m.OrderIndex);
        });

        modelBuilder.Entity<Citation>(entity =>
        {
            entity.HasOne(c => c.ChatMessage).WithMany(m => m.Citations).HasForeignKey(c => c.ChatMessageId);
            entity.HasIndex(c => c.ChatMessageId);
        });

        modelBuilder.Entity<DocumentReference>(entity =>
        {
            entity.HasOne(d => d.ChatSession).WithMany(s => s.DocumentReferences).HasForeignKey(d => d.ChatSessionId);
            entity.HasIndex(d => d.ChatSessionId);
        });

        modelBuilder.Entity<ConversationMemory>(entity =>
        {
            entity.HasOne(m => m.ChatSession).WithMany().HasForeignKey(m => m.ChatSessionId);
            entity.HasIndex(m => m.ChatSessionId);
            entity.HasIndex(m => m.MemoryKey);
        });

        modelBuilder.Entity<DocumentReview>(entity =>
        {
            entity.HasOne(r => r.Document).WithMany(d => d.Reviews).HasForeignKey(r => r.DocumentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(r => r.Project).WithMany().HasForeignKey(r => r.ProjectId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(r => r.Guide).WithMany().HasForeignKey(r => r.GuideId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(r => r.DocumentId);
            entity.HasIndex(r => r.GuideId);
            entity.HasIndex(r => r.Status);
        });

        modelBuilder.Entity<DocumentComment>(entity =>
        {
            entity.HasOne(c => c.Document).WithMany(d => d.Comments).HasForeignKey(c => c.DocumentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(c => c.ParentComment).WithMany(c => c.Replies).HasForeignKey(c => c.ParentCommentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(c => c.DocumentId);
            entity.HasIndex(c => c.ParentCommentId);
        });

        modelBuilder.Entity<LoginHistory>(entity =>
        {
            entity.HasOne(lh => lh.User).WithMany().HasForeignKey(lh => lh.UserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(lh => lh.UserId);
            entity.HasIndex(lh => lh.LoginTime);
            entity.HasIndex(lh => lh.IsSuccess);
        });
    }
}
