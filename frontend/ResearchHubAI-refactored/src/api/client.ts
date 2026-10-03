const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private _refreshing: Promise<boolean> | null = null;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorBody = await response.text();
      let message: string;
      try {
        const parsed = JSON.parse(errorBody);
        message = parsed.error?.detail || parsed.error?.title || parsed.title || errorBody;
      } catch {
        message = errorBody || `Request failed with status ${response.status}`;
      }

      if (response.status === 401 && this.getRefreshToken()) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          return { data: null as unknown as T, success: false, message: "retry" };
        }
        this.clearTokens();
        window.location.reload();
        throw new Error("Session expired. Please login again.");
      }

      throw new Error(message);
    }

    if (response.status === 204) {
      return { data: null as unknown as T, success: true };
    }

    const data = await response.json();
    return { data, success: true };
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (this._refreshing) return this._refreshing;
    this._refreshing = this._doRefresh();
    try { return await this._refreshing; }
    finally { this._refreshing = null; }
  }

  private async _doRefresh(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return true;
    } catch { return false; }
  }

  private clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  private async autoRetryOnExpiry<T>(fn: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
    const result = await fn();
    if (!result.success && result.message === "retry") {
      return fn();
    }
    return result;
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    if (!params) return path;
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    return qs ? `${path}?${qs}` : path;
  }

  // AbortSignal.any when available (modern browsers), otherwise external wins.
  private combineSignals(timeoutSignal: AbortSignal, external?: AbortSignal): AbortSignal {
    if (!external) return timeoutSignal;
    if (typeof AbortSignal.any === "function") return AbortSignal.any([timeoutSignal, external]);
    return external;
  }

  async get<T>(path: string, options?: { params?: Record<string, unknown>; signal?: AbortSignal }): Promise<ApiResponse<T>> {
    return this.autoRetryOnExpiry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const url = this.buildUrl(path, options?.params);
        const response = await fetch(`${this.baseUrl}${url}`, {
          method: "GET",
          headers: this.getHeaders(),
          signal: this.combineSignals(controller.signal, options?.signal),
        });
        return this.handleResponse<T>(response);
      } finally { clearTimeout(timeout); }
    });
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return this.autoRetryOnExpiry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      return this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeout);
    }
  });
}

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.autoRetryOnExpiry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: "PUT",
          headers: this.getHeaders(),
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        return this.handleResponse<T>(response);
      } finally { clearTimeout(timeout); }
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.autoRetryOnExpiry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        return this.handleResponse<T>(response);
      } finally {
        clearTimeout(timeout);
      }
    });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.autoRetryOnExpiry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: "DELETE",
          headers: this.getHeaders(),
          signal: controller.signal,
        });
        return this.handleResponse<T>(response);
      } finally { clearTimeout(timeout); }
    });
  }

  async upload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const headers: Record<string, string> = {};
      const token = this.getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal,
      });
      return this.handleResponse<T>(response);
    } finally { clearTimeout(timeout); }
  }

  async downloadBlob(path: string, signal?: AbortSignal): Promise<{ data: Blob; fileName: string; contentType: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: this.combineSignals(controller.signal, signal),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^";]+)"?/i);
      return {
        data,
        fileName: match?.[1] || "document",
        contentType: response.headers.get("Content-Type") || "application/octet-stream",
      };
    } finally { clearTimeout(timeout); }
  }
}

export const apiClient = new ApiClient();
