using Microsoft.AspNetCore.Http;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Coursework;

namespace TechGalaxySolutions.ResearchHub.Application.Interfaces;

public interface IStudentCourseworkService
{
    Task<List<StudentCourseworkResponse>> GetMyCourseworkAsync(
        Guid userId);

    Task<List<StudentCourseworkResponse>> GetPendingForGuideAsync(
    Guid guideUserId);    

    Task<StudentCourseworkResponse> CreateAsync(
        Guid userId,
        CreateStudentCourseworkRequest request);

    Task<StudentCourseworkResponse> UpdateAsync(
        Guid userId,
        Guid courseworkId,
        UpdateStudentCourseworkRequest request);

    Task DeleteAsync(
        Guid userId,
        Guid courseworkId);

    Task<StudentCourseworkResponse> ReviewAsync(
        Guid guideUserId,
        Guid courseworkId,
        ReviewStudentCourseworkRequest request);

    Task<FileDownloadResult?> DownloadCertificateAsync(
        Guid userId,
        Guid courseworkId);

    Task<FileDownloadResult?> DownloadCertificateForGuideAsync(
    Guid guideUserId,
    Guid courseworkId);   

    Task<List<StudentCourseworkResponse>> GetAllForGuideAsync(Guid guideUserId); 
}