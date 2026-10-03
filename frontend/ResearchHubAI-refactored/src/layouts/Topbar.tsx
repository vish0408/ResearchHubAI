import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import Avatar from "../components/common/Avatar";
import { useApp } from "../context/AppContext";
import { Role } from "../types/Role";
import { STUDENT_NAV } from "../utils/navigation";
import { studentService } from "../services/StudentService";

export default function Topbar({
  nav,
  onMenu,
  showSearch = true,
}: {
  nav: typeof STUDENT_NAV;
  onMenu: () => void;
  showSearch?: boolean;
}) {
  const { user, screen, setScreen, theme, setTheme, logout } = useApp();

  const [unreadCount, setUnreadCount] = useState(0);

  const label = nav.find((n) => n.id === screen)?.label || "Dashboard";

  const rc: Record<Role, string> = {
    student: "text-blue-600",
    guide: "text-indigo-600",
    admin: "text-slate-600",
    hod: "text-cyan-600",
    superadmin: "text-red-600",
    collegeadmin: "text-purple-600",
  };

  const rl: Record<Role, string> = {
    student: "PhD Student",
    guide: "Research Guide",
    admin: "Administrator",
    hod: "HOD",
    superadmin: "Super Admin",
    collegeadmin: "College Admin",
  };

  // Load unread notification count
  useEffect(() => {
    if (user?.role !== "student") {
      setUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const count = await studentService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error(
          "Failed to load unread notification count:",
          error
        );
        setUnreadCount(0);
      }
    };

    loadUnreadCount();

    // Refresh count periodically so new notifications appear automatically
    const interval = setInterval(loadUnreadCount, 10000);

    return () => clearInterval(interval);
  }, [user?.role, screen]);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-5 gap-3 flex-shrink-0">
      
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm font-bold text-foreground leading-none">
            {label}
          </h1>

          <p
            className={`text-xs font-semibold mt-0.5 ${
              rc[user?.role || "student"]
            }`}
          >
            {rl[user?.role || "student"]}
          </p>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="flex-1 max-w-xs hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />

            <input
              className="w-full bg-muted border border-border rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="Search..."
            />
          </div>
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-1.5">

        {/* Theme */}
        <button
          onClick={() =>
            setTheme(theme === "light" ? "dark" : "light")
          }
          className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() => setScreen("notifications")}
          className="relative w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />

          {/* Show red dot ONLY when unread notifications exist */}
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Profile */}
        <button
          onClick={() => setScreen("profile")}
          className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-muted cursor-pointer transition-colors"
        >
          <Avatar
            name={user?.name || "U"}
            size="sm"
            imageUrl={user?.profilePictureUrl}
          />

          <div className="hidden sm:block">
            <p className="text-xs font-bold text-foreground leading-none">
              {user?.name}
            </p>

            <p
              className={`text-xs ${
                rc[user?.role || "student"]
              } leading-none mt-0.5 capitalize`}
            >
              {user?.role}
            </p>
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}