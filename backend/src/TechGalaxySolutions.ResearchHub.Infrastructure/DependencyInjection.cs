using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TechGalaxySolutions.ResearchHub.Application.Configuration;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Infrastructure.AI;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;
using TechGalaxySolutions.ResearchHub.Infrastructure.Services;

namespace TechGalaxySolutions.ResearchHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection")));

        services.AddHttpContextAccessor();

        // Auth
        services.AddScoped<ITokenService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();

        // Student Workspace
        services.AddScoped<IStudentProfileService, StudentProfileService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IMilestoneService, MilestoneService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IDashboardService, DashboardService>();

        // Guide Workspace
        services.AddScoped<IGuideProfileService, GuideProfileService>();
        services.AddScoped<IGuideDashboardService, GuideDashboardService>();
        services.AddScoped<IGuideStudentService, GuideStudentService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IChapterService, ChapterService>();
        services.AddScoped<IChapterCommentService, ChapterCommentService>();
        services.AddScoped<IMeetingService, MeetingService>();
        services.AddScoped<IApprovalHistoryService, ApprovalHistoryService>();

        // HOD Workspace
        services.AddScoped<IHodProfileService, HodProfileService>();
        services.AddScoped<IHodDashboardService, HodDashboardService>();
        services.AddScoped<IHodStudentService, HodStudentService>();
        services.AddScoped<IHodGuideService, HodGuideService>();
        services.AddScoped<IProjectAllocationService, ProjectAllocationService>();
        services.AddScoped<IResearchCategoryService, ResearchCategoryService>();
        services.AddScoped<IResearchTopicService, ResearchTopicService>();
        services.AddScoped<IAnnouncementService, AnnouncementService>();
        services.AddScoped<IDepartmentReportService, DepartmentReportService>();

        // Admin Workspace
        services.AddScoped<ICollegeService, CollegeService>();
        services.AddScoped<IAdminDepartmentService, AdminDepartmentService>();
        services.AddScoped<IHodManagementService, HodManagementService>();
        services.AddScoped<IAcademicYearService, AcademicYearService>();
        services.AddScoped<ISemesterService, SemesterService>();
        services.AddScoped<IResearchStageService, ResearchStageService>();
        services.AddScoped<IScholarCourseworkService, ScholarCourseworkService>();
        services.AddScoped<IFacultyService, FacultyService>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IPermissionService, PermissionService>();
        services.AddScoped<IAdminDashboardService, AdminDashboardService>();
        services.AddScoped<IAdminAnnouncementService, AdminAnnouncementService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<ISystemSettingService, SystemSettingService>();

        // Documents & Comments
        services.AddScoped<IDocumentCommentService, DocumentCommentService>();
        services.AddScoped<IFileStorageService, FileStorageService>();

        // Thesis Review
        services.AddScoped<IThesisReviewService, ThesisReviewService>();

        // Student Coursework
services.AddScoped<IStudentCourseworkService, StudentCourseworkService>();

        // Literature Review
        services.AddScoped<ILiteratureReviewService, LiteratureReviewService>();

        // Chat / AI Research
        services.AddScoped<IChatService, ChatService>();

        // HOD Progress & Proposals
        services.AddScoped<IHodProgressService, HodProgressService>();
        services.AddScoped<IHodProposalService, HodProposalService>();

        // Login History
        services.AddScoped<ILoginHistoryService, LoginHistoryService>();

        // Project Analytics
        services.AddScoped<IProjectAnalyticsService, ProjectAnalyticsService>();

        // Legacy Document Migration
        services.AddScoped<ILegacyDocumentMigrationService, LegacyDocumentMigrationService>();

        // AI Providers
        var aiSettings = new AISettings();
        configuration.GetSection("AI").Bind(aiSettings);
        services.AddSingleton(aiSettings);

        services.AddHttpClient();

        services.AddSingleton<IAIProvider, OpenAIProvider>();
        services.AddSingleton<IAIProvider, AnthropicProvider>();
        services.AddSingleton<IAIProvider, GeminiProvider>();
        services.AddSingleton<AIProviderFactory>();

        // Proposal Generator
        services.AddScoped<IProposalGeneratorService, ProposalGeneratorService>();

        // Email
        services.Configure<SmtpSettings>(configuration.GetSection("Smtp"));
        services.Configure<FrontendSettings>(configuration.GetSection("Frontend"));
        services.AddScoped<IEmailService, EmailService>();

        return services;
    }
}
