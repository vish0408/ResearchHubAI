export interface StudentProfileDto {
  id?: string;
  fullName?: string;
  email?: string;
  enrollment?: string;
  department?: string;
  institution?: string;
  researchTopic?: string;
  guideId?: string | null;
  guideName?: string | null;

  profilePictureUrl?: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  studentId: string;
  studentName: string;
  startDate: string;
  targetEndDate: string | null;
  completionPercentage: number;
  createdAt: string;
  members: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
}

export interface TaskItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploaderId: string;
  uploaderName: string;
  uploadedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardData {
  currentProject: ProjectSummary | null;
  completionPercentage: number;
  pendingTasks: number;
  completedTasks: number;
  upcomingMilestones: MilestoneSummary[];
  recentDocuments: DocumentSummary[];
  notifications: AppNotification[];
  joiningCohort: string | null;
  researchStageName: string | null;
  requiredCredits: number | null;
  earnedCredits: number | null;
  passedPapers: number;
  pendingPapers: number;
  courseworkStatus: string | null;
  courseworkCompletionPercentage: number;
}

export interface ProjectSummary {
  id: string;
  title: string;
  status: string;
  completionPercentage: number;
}

export interface MilestoneSummary {
  id: string;
  title: string;
  targetDate: string;
  isCompleted: boolean;
}

export interface DocumentSummary {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  uploaderName: string;
}
