import { apiClient } from "../api/client";
import { StudentProfileDto, Project, TaskItem, Milestone, ProjectDocument, AppNotification, DashboardData } from "../types/Student";
import type {
  Chapter,
  ChapterVersion,
  Meeting,
} from "../types/Guide";
import type { PagedResponse } from "../types/Pagination";

export class StudentService {
  // Profile
  async getProfile(): Promise<StudentProfileDto> {
  const res = await apiClient.get<StudentProfileDto>("/student/profile");

  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to get profile");
  }

  return res.data;
}

async updateProfile(
  data: Partial<StudentProfileDto>
): Promise<StudentProfileDto> {
  const res = await apiClient.put<StudentProfileDto>(
    "/student/profile",
    data
  );

  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to update profile");
  }

  return res.data;
}

async uploadProfilePicture(
  file: File
): Promise<StudentProfileDto> {
  const formData = new FormData();

  formData.append("file", file);

  const res = await apiClient.upload<StudentProfileDto>(
    "/student/profile/photo",
    formData
  );

  if (!res.success || !res.data) {
    throw new Error(
      res.message || "Failed to upload profile picture"
    );
  }

  return res.data;
}

async markChapterFeedbackThreadAsRead(
  chapterId: string,
  threadId: string
): Promise<void> {
  const res = await apiClient.patch(
    `/chapters/${chapterId}/comments/thread/${threadId}/read`
  );

  if (!res.success) {
    throw new Error(
      res.message || "Failed to mark feedback as read"
    );
  }
}

  // Dashboard
  async getDashboard(): Promise<DashboardData> {
    const res = await apiClient.get<DashboardData>("/dashboard/student");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get dashboard");
    return res.data;
  }

  // Projects
  async getMyProjects(): Promise<PagedResponse<Project>> {
    const res = await apiClient.get<PagedResponse<Project>>("/projects/my");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get projects");
    return res.data;
  }

  async getProject(id: string): Promise<Project> {
    const res = await apiClient.get<Project>(`/projects/${id}`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get project");
    return res.data;
  }

  async createProject(data: { title: string; description: string; targetEndDate?: string }): Promise<Project> {
    const res = await apiClient.post<Project>("/projects", data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to create project");
    return res.data;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const res = await apiClient.put<Project>(`/projects/${id}`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to update project");
    return res.data;
  }

  async deleteProject(id: string): Promise<void> {
    const res = await apiClient.delete(`/projects/${id}`);
    if (!res.success) throw new Error(res.message || "Failed to delete project");
  }

  async addProjectMember(projectId: string, userId: string, role: string): Promise<void> {
    const res = await apiClient.post(`/projects/${projectId}/members`, { userId, role });
    if (!res.success) throw new Error(res.message || "Failed to add member");
  }

  async removeProjectMember(projectId: string, memberId: string): Promise<void> {
    const res = await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
    if (!res.success) throw new Error(res.message || "Failed to remove member");
  }

  // Tasks
  async getTasks(projectId: string): Promise<TaskItem[]> {
    const res = await apiClient.get<TaskItem[]>(`/projects/${projectId}/tasks`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get tasks");
    return res.data;
  }

  async createTask(projectId: string, data: Partial<TaskItem>): Promise<TaskItem> {
    const res = await apiClient.post<TaskItem>(`/projects/${projectId}/tasks`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to create task");
    return res.data;
  }

  async updateTask(projectId: string, taskId: string, data: Partial<TaskItem>): Promise<TaskItem> {
    const res = await apiClient.put<TaskItem>(`/projects/${projectId}/tasks/${taskId}`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to update task");
    return res.data;
  }

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    const res = await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
    if (!res.success) throw new Error(res.message || "Failed to delete task");
  }

  // Milestones
  async getMilestones(projectId: string): Promise<Milestone[]> {
    const res = await apiClient.get<Milestone[]>(`/projects/${projectId}/milestones`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get milestones");
    return res.data;
  }

  async createMilestone(projectId: string, data: Partial<Milestone>): Promise<Milestone> {
    const res = await apiClient.post<Milestone>(`/projects/${projectId}/milestones`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to create milestone");
    return res.data;
  }

  async updateMilestone(projectId: string, milestoneId: string, data: Partial<Milestone>): Promise<Milestone> {
    const res = await apiClient.put<Milestone>(`/projects/${projectId}/milestones/${milestoneId}`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to update milestone");
    return res.data;
  }

  async deleteMilestone(projectId: string, milestoneId: string): Promise<void> {
    const res = await apiClient.delete(`/projects/${projectId}/milestones/${milestoneId}`);
    if (!res.success) throw new Error(res.message || "Failed to delete milestone");
  }

  // Documents 
async getDocuments(projectId: string): Promise<ProjectDocument[]> { 
  const res = await apiClient.get<ProjectDocument[]>(`/projects/${projectId}/documents`); 
  if (!res.success || !res.data) throw new Error(res.message || "Failed to get documents"); 
  return res.data; 
}

async getChapterVersions(projectId: string, chapterId: string) {
  const res = await apiClient.get(
    `/projects/${projectId}/chapters/${chapterId}/versions`
  );

  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to get chapter versions");
  }

  return res.data;
}


async createChapterVersion(
  projectId: string,
  chapterId: string,
  file: File
): Promise<ChapterVersion> {
  const formData = new FormData();

  formData.append("file", file);

  const res = await apiClient.upload<ChapterVersion>(
    `/projects/${projectId}/chapters/${chapterId}/versions`,
    formData
  );

  if (!res.success || !res.data) {
    throw new Error(
      res.message || "Failed to create chapter version"
    );
  }

  return res.data;
}


  async createDocument(projectId: string, data: Partial<ProjectDocument>): Promise<ProjectDocument> {
    const res = await apiClient.post<ProjectDocument>(`/projects/${projectId}/documents`, data);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to create document");
    return res.data;
  }

  async deleteDocument(projectId: string, documentId: string): Promise<void> {
    const res = await apiClient.delete(`/projects/${projectId}/documents/${documentId}`);
    if (!res.success) throw new Error(res.message || "Failed to delete document");
  }

  async uploadDocument(projectId: string, file: File): Promise<ProjectDocument> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.upload<ProjectDocument>(`/projects/${projectId}/documents/upload`, formData);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to upload document");
    return res.data;
  }

  async downloadDocument(projectId: string, documentId: string): Promise<{ data: Blob; fileName: string; contentType: string }> {
    return apiClient.downloadBlob(`/projects/${projectId}/documents/${documentId}/download`);
  }

  async previewDocument(projectId: string, documentId: string): Promise<{ data: Blob; fileName: string; contentType: string }> {
    return apiClient.downloadBlob(`/projects/${projectId}/documents/${documentId}/preview`);
  }

  // Chapters
  async getProjectChapters(projectId: string): Promise<Chapter[]> {
    const res = await apiClient.get<Chapter[]>(`/projects/${projectId}/chapters`);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get chapters");
    return res.data;
  }

 

  async createChapter(
  projectId: string,
  title: string,
  order: number,
  file: File
): Promise<Chapter> {
  const formData = new FormData();

  formData.append("title", title);
  formData.append("order", order.toString());
  formData.append("file", file);

  const res = await apiClient.upload<Chapter>(
    `/projects/${projectId}/chapters`,
    formData
  );

  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to create chapter");
  }

  return res.data;
}

//  async createChapterVersion(
//   projectId: string,
//   chapterId: string,
//   data: { content: string }
// ): Promise<ChapterVersion> {
//   const res = await apiClient.post<ChapterVersion>(
//     `/projects/${projectId}/chapters/${chapterId}/versions`,
//     data
//   );

//   if (!res.success || !res.data) {
//     throw new Error(
//       res.message || "Failed to create chapter version"
//     );
//   }

//   return res.data;
// }

async addChapterComment(
  chapterId: string,
  data: {
    content: string;
    lineNumber?: number;
    parentCommentId?: string | null;
    feedbackThreadId?: string | null;
  }
): Promise<void> {
  const res = await apiClient.post(
    `/chapters/${chapterId}/comments`,
    data
  );

  if (!res.success) {
    throw new Error(res.message || "Failed to add comment");
  }
}

// Meetings
async getMyMeetings(): Promise<Meeting[]> {
  const res = await apiClient.get<PagedResponse<Meeting>>("/meetings");

  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to get meetings");
  }

  return res.data.items;
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

  async cancelMeeting(id: string): Promise<Meeting> {
  const res = await apiClient.put<Meeting>(`/meetings/${id}/cancel`, {});

  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to cancel meeting");
  }

  return res.data;
}

  async submitChapter(
  projectId: string,
  chapterId: string
): Promise<Chapter> {
  const res = await apiClient.post<Chapter>(
    `/projects/${projectId}/chapters/${chapterId}/submit`
  );

  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to submit chapter");
  }

  return res.data;
}

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const res = await apiClient.get<AppNotification[] | PagedResponse<AppNotification>>("/notifications");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to get notifications");
    return Array.isArray(res.data) ? res.data : res.data.items;
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
}

export const studentService = new StudentService();
