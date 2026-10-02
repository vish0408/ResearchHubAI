namespace TechGalaxySolutions.ResearchHub.Domain.Entities;

public class StudentProfile : BaseEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public string Enrollment { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string Institution { get; set; } = string.Empty;

    public string? ResearchTopic { get; set; }

    public string? ProfilePictureUrl { get; set; }

    public Guid? GuideId { get; set; }

    public User? Guide { get; set; }

    public Guid? AcademicYearId { get; set; }

    public AcademicYear? AcademicYear { get; set; }

    public Guid? SemesterId { get; set; }

    public Semester? Semester { get; set; }

    public string? Section { get; set; }

    public DateTime? JoiningCohort { get; set; }

    public DateTime? RegistrationDate { get; set; }

    public string? PhdMode { get; set; }

    public int? RequiredCredits { get; set; }

    public Guid? ResearchStageId { get; set; }

    public ResearchStage? ResearchStage { get; set; }

    public ICollection<ScholarCoursework> Coursework { get; set; } = new List<ScholarCoursework>();
}
