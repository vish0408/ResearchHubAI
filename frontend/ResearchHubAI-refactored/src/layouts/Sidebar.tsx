import {
  ChevronLeft,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

import Avatar from "../components/common/Avatar";
import { useApp } from "../context/AppContext";
import { Role } from "../types/Role";
import { STUDENT_NAV } from "../utils/navigation";

export default function Sidebar({
  nav,
  collapsed,
  setCollapsed,
}: {
  nav: typeof STUDENT_NAV;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const {
    screen,
    setScreen,
    user,
    guideCommentsCount,
  } = useApp();

  const rc: Record<Role, string> = {
    student:
      "from-blue-600 to-indigo-600",
    guide:
      "from-indigo-600 to-violet-600",
    admin:
      "from-slate-700 to-slate-900",
    hod:
      "from-cyan-600 to-blue-700",
    superadmin:
      "from-red-600 to-rose-800",
    collegeadmin:
      "from-purple-600 to-violet-800",
  };

  const rl: Record<Role, string> = {
    student: "PhD Scholar",
    guide: "Research Guide",
    admin: "Administrator",
    hod: "HOD",
    superadmin: "Super Admin",
    collegeadmin: "College Admin",
  };

  return (
    <aside
      className={`flex flex-col bg-sidebar border-r border-sidebar-border h-full transition-all duration-300 ${
        collapsed
          ? "w-[62px]"
          : "w-[220px]"
      } flex-shrink-0`}
    >
      {/* =====================================
          LOGO
      ====================================== */}
      <div
        className={`flex items-center ${
          collapsed
            ? "justify-center px-3"
            : "px-4"
        } h-16 border-b border-sidebar-border gap-2.5`}
      >
        <div
          className={`w-8 h-8 bg-gradient-to-br ${
            rc[user?.role || "student"]
          } rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <FlaskConical className="w-4 h-4 text-white" />
        </div>

        {!collapsed && (
          <span className="font-bold text-sm text-sidebar-foreground whitespace-nowrap">
            ResearchHub{" "}
            <span className="text-blue-500">
              AI
            </span>
          </span>
        )}
      </div>

      {/* =====================================
          USER CARD
      ====================================== */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1">
          <div
            className={`bg-gradient-to-r ${
              rc[user?.role || "student"]
            } rounded-xl px-3 py-2.5 flex items-center gap-2.5`}
          >
            <Avatar
              name={user?.name || "U"}
              size="sm"
              bg="bg-white/25"
              imageUrl={
                user?.profilePictureUrl
              }
            />

            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">
                {user?.name}
              </p>

              <p className="text-white/70 text-xs truncate">
                {rl[user?.role || "student"]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================
          NAVIGATION
      ====================================== */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-hide">
        {nav.map((item) => {
          const active =
            screen === item.id;

          // -----------------------------------
          // Dynamic Guide Comments badge
          // -----------------------------------
          const badge =
            item.id === "guide-comments" &&
            user?.role === "student"
              ? guideCommentsCount > 0
                ? String(
                    guideCommentsCount
                  )
                : null
              : item.badge;

          return (
            <button
              key={item.id}
              onClick={() =>
                setScreen(item.id)
              }
              title={
                collapsed
                  ? item.label
                  : undefined
              }
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl mb-0.5 transition-all relative ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
              }`}
            >
              <item.icon
                className={`w-[18px] h-[18px] flex-shrink-0 ${
                  active
                    ? "text-sidebar-primary"
                    : ""
                }`}
              />

              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1 text-left whitespace-nowrap">
                    {item.label}
                  </span>

                  {badge && (
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${
                        badge === "AI"
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                          : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </>
              )}

              {/* Collapsed sidebar badge */}
              {collapsed &&
                badge && (
                  <span
                    className={`absolute top-1 right-1 ${
                      badge === "AI"
                        ? "w-2 h-2 bg-blue-500"
                        : "w-2 h-2 bg-red-500"
                    } rounded-full`}
                  />
                )}
            </button>
          );
        })}
      </nav>

      {/* =====================================
          COLLAPSE BUTTON
      ====================================== */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <button
          onClick={() =>
            setCollapsed(!collapsed)
          }
          className={`w-full flex items-center ${
            collapsed
              ? "justify-center"
              : "gap-2.5 px-2.5"
          } py-2 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all`}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">
                Collapse
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}