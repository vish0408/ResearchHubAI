import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { CurrentUser } from "../types/User";
import { Theme } from "../types/Common";
import { authService } from "../services/AuthService";
import { studentService } from "../services/StudentService";

export interface AppContextType {
  user: CurrentUser | null;
  updateUser: (user: CurrentUser) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  screen: string;
  setScreen: (s: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;

  guideCommentsCount: number;
  refreshGuideCommentsCount: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  updateUser: () => {},
  theme: "light",
  setTheme: () => {},
  screen: "dashboard",
  setScreen: () => {},
  login: async () => {},
  logout: async () => {},
  isLoading: true,

  guideCommentsCount: 0,
  refreshGuideCommentsCount: async () => {},
});

export const useApp = () => useContext(AppContext);

async function restoreSession(): Promise<CurrentUser | null> {
  const storedUser = authService.getStoredUser();
  const accessToken = authService.getStoredAccessToken();

  if (!storedUser || !accessToken) {
    authService.clearTokens();
    return null;
  }

  try {
    const user = await authService.getCurrentUser();
    authService.saveUser(user);
    return user;
  } catch {
    authService.clearTokens();
    return null;
  }
}

export function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [theme, setThemeState] =
    useState<Theme>("light");

  const [screen, setScreen] =
    useState("dashboard");

  const [isLoading, setIsLoading] =
    useState(true);

  const [guideCommentsCount, setGuideCommentsCount] =
    useState(0);

  // ---------------------------------------
  // Update global logged-in user
  // ---------------------------------------
  const updateUser = (updatedUser: CurrentUser) => {
    setUser(updatedUser);
    authService.saveUser(updatedUser);
  };

  // ---------------------------------------
  // Refresh Guide Comments badge count
  // ---------------------------------------
  const refreshGuideCommentsCount = async () => {
    if (!user || user.role !== "student") {
      setGuideCommentsCount(0);
      return;
    }

    try {
      // Get student's profile so we know the assigned guide
      const profile =
        await studentService.getProfile();

      if (!profile?.guideId) {
        setGuideCommentsCount(0);
        return;
      }

      // Get all student's projects
      const paged =
        await studentService.getMyProjects();

      const projects = paged.items || [];

      if (projects.length === 0) {
        setGuideCommentsCount(0);
        return;
      }

      // Get chapters/comments from all projects
      const chapterResults = await Promise.all(
        projects.map((project) =>
          studentService.getProjectChapters(
            project.id
          )
        )
      );

      const allComments =
        chapterResults.flatMap(
          (chapters) =>
            (chapters || []).flatMap(
              (chapter) =>
                Array.isArray(chapter.comments)
                  ? chapter.comments
                  : []
            )
        );

      // ---------------------------------------
      // Find unique feedback threads created
      // by the student's assigned guide
      // ---------------------------------------
      const feedbackThreadIds = Array.from(
        new Set(
          allComments
            .filter(
              (comment) =>
                !comment.parentCommentId &&
                profile.guideId === comment.userId &&
                comment.feedbackThreadId
            )
            .map(
              (comment) =>
                comment.feedbackThreadId
            )
        )
      );

      // ---------------------------------------
      // Count only unresolved threads
      // ---------------------------------------
      const unresolvedCount =
        feedbackThreadIds.filter(
          (threadId) => {
            const threadComments =
              allComments.filter(
                (comment) =>
                  comment.feedbackThreadId ===
                  threadId
              );

            return (
              threadComments.length > 0 &&
              !threadComments.every(
                (comment) =>
                  comment.isResolved
              )
            );
          }
        ).length;

      setGuideCommentsCount(
        unresolvedCount
      );
    } catch (error) {
      console.error(
        "Failed to refresh guide comments count:",
        error
      );
    }
  };

  // ---------------------------------------
  // Theme
  // ---------------------------------------
  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle(
      "dark",
      t === "dark"
    );
  };

  // ---------------------------------------
  // Login
  // ---------------------------------------
  const login = async (
    email: string,
    password: string
  ) => {
    const payload =
      await authService.login(
        email,
        password
      );

    authService.saveTokens(
      payload.accessToken,
      payload.refreshToken
    );

    const currentUser =
      await authService.getCurrentUser();

    authService.saveUser(currentUser);
    setUser(currentUser);
    setScreen("dashboard");
  };

  // ---------------------------------------
  // Logout
  // ---------------------------------------
  const logout = async () => {
    const refreshToken =
      authService.getStoredRefreshToken();

    if (refreshToken) {
      await authService.logout(
        refreshToken
      );
    }

    authService.clearTokens();

    setUser(null);
    setGuideCommentsCount(0);
    setScreen("dashboard");
  };

  // ---------------------------------------
  // Dark mode
  // ---------------------------------------
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );
  }, [theme]);

  // ---------------------------------------
  // Restore session
  // ---------------------------------------
  useEffect(() => {
    let mounted = true;

    restoreSession()
      .then((restoredUser) => {
        if (mounted) {
          setUser(restoredUser);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------------------
  // Load Guide Comments badge
  // ---------------------------------------
  useEffect(() => {
    if (!user || user.role !== "student") {
      setGuideCommentsCount(0);
      return;
    }

    refreshGuideCommentsCount();

    // Refresh when browser/tab becomes active
    const handleFocus = () => {
      refreshGuideCommentsCount();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    // Periodic refresh so guide approval/new
    // feedback is reflected automatically.
    const interval = window.setInterval(
      () => {
        refreshGuideCommentsCount();
      },
      30000
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );

      window.clearInterval(interval);
    };
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        user,
        updateUser,
        theme,
        setTheme,
        screen,
        setScreen,
        login,
        logout,
        isLoading,

        guideCommentsCount,
        refreshGuideCommentsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}