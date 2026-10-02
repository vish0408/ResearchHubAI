import { apiClient } from "../api/client";
import {
  GuideProfileDto,
  GuideDashboardData,
  Review,
  Chapter,
  ChapterVersion,
  ChapterComment,
  Meeting,
  ApprovalHistoryEntry,
  ThesisDocumentSummary,
  ThesisReviewResponse,
} from "../types/Guide";
import type { AppNotification } from "../types/Student";
import type { PagedResponse } from "../types/Pagination";


export class GuideService {
  // Profile
  async getProfile(): Promise<GuideProfileDto> {
    const res = await apiClient.get<GuideProfileDto>("/guide/profile");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get profile");
    return res.data;
  }
  async updateProfile(data: Partial<GuideProfileDto>): Promise<GuideProfileDto> {
    const res = await apiClient.put<GuideProfileDto>("/guide/profile", data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to update profile");
    return res.data;
  }

  // Dashboard
  async getDashboard(): Promise<GuideDashboardData> {
    const res = await apiClient.get<GuideDashboardData>("/dashboard/guide");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get dashboard");
    return res.data;
  }

  // Reviews
  async getMyReviews(): Promise<Review[]> {
    const res = await apiClient.get<PagedResponse<Review>>("/reviews/my");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get reviews");
    return res.data.items;
  }
  async getProjectReviews(projectId: string): Promise<Review[]> {
    const res = await apiClient.get<PagedResponse<Review>>(`/reviews/project/${projectId}`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get project reviews");
    return res.data.items;
  }
  async createReview(projectId: string, data: { status: string; notes: string }): Promise<Review> {
    const res = await apiClient.post<Review>(`/reviews/project/${projectId}`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to create review");
    return res.data;
  }
  async getThesisReviews(): Promise<ThesisDocumentSummary[]> {
    const res = await apiClient.get<ThesisDocumentSummary[]>("/guide/thesis-reviews");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get thesis reviews");
    return res.data;
  }
  async reviewThesisDocument(documentId: string, data: { status: string; comment?: string; score?: number }): Promise<ThesisReviewResponse> {
    const res = await apiClient.post<ThesisReviewResponse>(`/guide/thesis-reviews/${documentId}/review`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to submit thesis review");
    return res.data;
  }

  // Chapters
  async getProjectChapters(projectId: string): Promise<Chapter[]> {
    const res = await apiClient.get<Chapter[]>(`/projects/${projectId}/chapters`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get chapters");
    return res.data;
  }
  
  async getChapterVersions(
  projectId: string,
  chapterId: string
): Promise<ChapterVersion[]> {
  const res = await apiClient.get<ChapterVersion[]>(
    `/projects/${projectId}/chapters/${chapterId}/versions`
  );

  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to get chapter versions");
  }

  return res.data;
}

  async getChapter(projectId: string, chapterId: string): Promise<Chapter> {
    const res = await apiClient.get<Chapter>(`/projects/${projectId}/chapters/${chapterId}`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get chapter");
    return res.data;
  }
  async updateChapterStatus(projectId: string, chapterId: string, data: { status: string; comment?: string }): Promise<Chapter> {
    const res = await apiClient.put<Chapter>(`/projects/${projectId}/chapters/${chapterId}/status`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to update chapter status");
    return res.data;
  }

  // Chapter Comments
  async getChapterComments(chapterId: string): Promise<ChapterComment[]> {
    const res = await apiClient.get<ChapterComment[]>(`/chapters/${chapterId}/comments`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get comments");
    return res.data;
  }
  async addChapterComment(chapterId: string, data: { content: string; lineNumber?: number }): Promise<ChapterComment> {
    const res = await apiClient.post<ChapterComment>(`/chapters/${chapterId}/comments`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to add comment");
    return res.data;
  }
  async deleteChapterComment(chapterId: string, commentId: string): Promise<void> {
    const res = await apiClient.delete(`/chapters/${chapterId}/comments/${commentId}`);
    if (!res.success) throw new Error(res.message || "Failed to delete comment");
  }

  // Meetings
  async getMyMeetings(): Promise<Meeting[]> {
    const res = await apiClient.get<PagedResponse<Meeting>>("/meetings");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get meetings");
    return res.data.items;
  }
  async getMeeting(id: string): Promise<Meeting> {
    const res = await apiClient.get<Meeting>(`/meetings/${id}`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get meeting");
    return res.data;
  }
  async createMeeting(data: {
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes?: number;
    agenda?: string;
    meetingLink?: string;
    participantIds?: string[];
  }): Promise<Meeting> {
    const res = await apiClient.post<Meeting>("/meetings", data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to create meeting");
    return res.data;
  }
  async updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting> {
    const res = await apiClient.put<Meeting>(`/meetings/${id}`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to update meeting");
    return res.data;
  }
  async deleteMeeting(id: string): Promise<void> {
    const res = await apiClient.delete(`/meetings/${id}`);
    if (!res.success) throw new Error(res.message || "Failed to delete meeting");
  }

  // Approval History
  async getProjectHistory(projectId: string): Promise<ApprovalHistoryEntry[]> {
    const res = await apiClient.get<ApprovalHistoryEntry[]>(`/approval-history/project/${projectId}`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get history");
    return res.data;
  }
  async getChapterHistory(chapterId: string): Promise<ApprovalHistoryEntry[]> {
    const res = await apiClient.get<ApprovalHistoryEntry[]>(`/approval-history/chapter/${chapterId}`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get chapter history");
    return res.data;
  }

  // Notifications (shared)
  async getNotifications(): Promise<AppNotification[]> {
    const res = await apiClient.get<AppNotification[] | PagedResponse<AppNotification>>("/notifications");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get notifications");
    return Array.isArray(res.data) ? res.data : res.data.items;
  }

  async sendNotification(
  recipientId: string,
  title: string,
  message: string,
  type: string
): Promise<AppNotification> {
  const res = await apiClient.post<AppNotification>(
    "/notifications/send",
    {
      recipientId,
      title,
      message,
      type
    }
  );

  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to send notification");
  }

  return res.data;
}

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ count: number }>("/notifications/unread-count");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get unread count");
    return res.data.count;
  }
  async markNotificationsRead(ids: string[]): Promise<void> {
    const res = await apiClient.put("/notifications/mark-read", { notificationIds: ids });
    if (!res.success) throw new Error(res.message || "Failed to mark as read");
  }
  async markAllNotificationsRead(): Promise<void> {
    const res = await apiClient.put("/notifications/mark-all-read", {});
    if (!res.success) throw new Error(res.message || "Failed to mark all as read");
  }


async downloadChapterVersion(
  projectId: string,
  chapterId: string,
  versionId: string
) {
  return await apiClient.downloadBlob(
    `/projects/${projectId}/chapters/${chapterId}/versions/${versionId}/download`
  );
}


}

export const guideService = new GuideService();
