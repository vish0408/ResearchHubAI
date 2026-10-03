import { Role } from "./Role";

export interface CurrentUser {
  name: string;
  email: string;
  role: Role;
  dept: string;
  institution: string;
  avatar: string;

  profilePictureUrl?: string;

  enrollment?: string;
  designation?: string;
  collegeId?: string;
  collegeName?: string;
  departmentId?: string;
  departmentName?: string;
}