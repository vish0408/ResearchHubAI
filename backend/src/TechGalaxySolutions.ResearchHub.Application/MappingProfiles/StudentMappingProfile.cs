using AutoMapper;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Dashboard;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Document;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Milestone;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Notification;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Project;
using TechGalaxySolutions.ResearchHub.Application.DTOs.StudentProfile;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Task;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Domain.Entities.Enums;

namespace TechGalaxySolutions.ResearchHub.Application.MappingProfiles;

public class StudentMappingProfile : Profile
{
    public StudentMappingProfile()
    {
      CreateMap<StudentProfile, StudentProfileResponse>()
    .ForMember(
        dest => dest.FullName,
        opt => opt.MapFrom(src => src.User.FullName))
    .ForMember(
        dest => dest.Email,
        opt => opt.MapFrom(src => src.User.Email))
    .ForMember(
        dest => dest.GuideName,
        opt => opt.MapFrom(src =>
            src.Guide != null ? src.Guide.FullName : null));

        CreateMap<Project, ProjectResponse>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => src.Student.FullName))
            .ForMember(dest => dest.Members, opt => opt.MapFrom(src => src.Members));

        CreateMap<ProjectMember, ProjectMemberResponse>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.FullName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

        CreateMap<TaskItem, TaskItemResponse>()
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.AssignedToName, opt => opt.MapFrom(src => src.AssignedTo != null ? src.AssignedTo.FullName : null));

        CreateMap<Milestone, MilestoneResponse>();

        CreateMap<ProjectDocument, DocumentResponse>()
            .ForMember(dest => dest.UploaderName, opt => opt.MapFrom(src => src.Uploader.FullName));

        CreateMap<Domain.Entities.Notification, NotificationResponse>();

        // Dashboard
        CreateMap<Project, ProjectSummary>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        CreateMap<Milestone, MilestoneSummary>();

        CreateMap<ProjectDocument, DocumentSummary>()
            .ForMember(dest => dest.UploaderName, opt => opt.MapFrom(src => src.Uploader.FullName));
    }
}
