using TechGalaxySolutions.ResearchHub.Application.DTOs.Common;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Meeting;

namespace TechGalaxySolutions.ResearchHub.Application.Interfaces;

public interface IMeetingService
{
    Task<PagedResponse<MeetingResponse>> GetMyMeetingsAsync(Guid userId, PagedRequest request);
    Task<MeetingResponse> GetByIdAsync(Guid meetingId);
    Task<MeetingResponse> CreateAsync(Guid guideId, CreateMeetingRequest request);
    Task<MeetingResponse> UpdateAsync(Guid meetingId, Guid userId, UpdateMeetingRequest request);
    Task DeleteAsync(Guid meetingId, Guid userId);
    Task<MeetingResponse> CancelAsync(Guid meetingId, Guid userId);
}
