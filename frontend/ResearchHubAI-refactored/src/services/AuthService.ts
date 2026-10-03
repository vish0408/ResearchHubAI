import { apiClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { CurrentUser } from "../types/User";

export interface LoginPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface BackendCurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  collegeId?: string;
  collegeName?: string;
  departmentId?: string;
  departmentName?: string;
  designation?: string;
  profilePictureUrl?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  expired?: boolean;
  used?: boolean;
  fullName?: string;
  email?: string;
  userId?: string;
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginPayload> {
    const response = await apiClient.post<LoginPayload>(ENDPOINTS.auth.login, {
      email,
      password,
    });
    if (!response.success || !response.data) {
      throw new Error(response.message || "Login failed");
    }
    return response.data;
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.auth.logout, { refreshToken });
    } catch {
      // Logout is best-effort
    }
  }

  async getCurrentUser(): Promise<CurrentUser> {
    const response = await apiClient.get<BackendCurrentUser>(ENDPOINTS.auth.me);
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to get current user");
    }
    return this.mapToCurrentUser(response.data);
  }

  async register(
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: string
  ): Promise<void> {
    const response = await apiClient.post(ENDPOINTS.auth.register, {
      fullName,
      email,
      password,
      confirmPassword,
      role,
    });
    if (!response.success) {
      throw new Error(response.message || "Registration failed");
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await apiClient.post("/auth/forgot-password", { email });
    if (!response.success) {
      throw new Error(response.message || "Failed to send password reset email");
    }
  }

  async validateActivationToken(token: string): Promise<TokenValidationResult> {
    const response = await apiClient.post<TokenValidationResult>("/auth/activate/validate", { token });
    if (!response.success) throw new Error(response.message || "Invalid activation token");
    return response.data ?? {} as TokenValidationResult;
  }

  async activateAccount(token: string, password: string, confirmPassword: string): Promise<void> {
    const response = await apiClient.post("/auth/activate", { token, password, confirmPassword });
    if (!response.success) throw new Error(response.message || "Account activation failed");
  }

  async resendActivation(token: string): Promise<void> {
    const response = await apiClient.post("/auth/activate/resend", { token });
    if (!response.success) throw new Error(response.message || "Failed to resend activation email");
  }

  async validatePasswordResetToken(token: string): Promise<TokenValidationResult> {
    const response = await apiClient.post<TokenValidationResult>("/auth/reset-password/validate", { token });
    if (!response.success) throw new Error(response.message || "Invalid password reset token");
    return response.data ?? {} as TokenValidationResult;
  }

  async resetPassword(token: string, email: string, newPassword: string, confirmPassword: string): Promise<void> {
    const response = await apiClient.post("/auth/reset-password", { token, email, newPassword, confirmPassword });
    if (!response.success) throw new Error(response.message || "Failed to reset password");
  }

  async resendPasswordReset(token: string): Promise<void> {
    const response = await apiClient.post("/auth/reset-password/resend", { token });
    if (!response.success) throw new Error(response.message || "Failed to resend password reset email");
  }

  async changePassword(currentPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    const response = await apiClient.post("/auth/change-password", { currentPassword, newPassword, confirmNewPassword });
    if (!response.success) throw new Error(response.message || "Failed to change password");
  }

  clearRequiresPasswordChange(): void {
    localStorage.removeItem("forcePasswordChange");
  }

  private mapToCurrentUser(backendUser: BackendCurrentUser): CurrentUser {
    const role = backendUser.role.toLowerCase() as CurrentUser["role"];
    return {
      name: backendUser.fullName,
      email: backendUser.email,
      role,
      dept: backendUser.departmentName ?? "",
      institution: backendUser.collegeName ?? "",
      avatar: backendUser.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
        profilePictureUrl: backendUser.profilePictureUrl,
      designation: backendUser.designation,
      collegeId: backendUser.collegeId,
      collegeName: backendUser.collegeName,
      departmentId: backendUser.departmentId,
      departmentName: backendUser.departmentName,
    };
  }

  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  getStoredAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  getStoredRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  saveUser(user: CurrentUser): void {
    localStorage.setItem("user", JSON.stringify(user));
  }

  getStoredUser(): CurrentUser | null {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
