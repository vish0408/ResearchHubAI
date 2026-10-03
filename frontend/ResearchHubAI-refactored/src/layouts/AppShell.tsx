// import { useEffect, useState } from "react";
// import Sidebar from "./Sidebar";
// import Topbar from "./Topbar";
// import AdminLayout from "./AdminLayout";
// import GuideLayout from "./GuideLayout";
// import HodLayout from "./HodLayout";
// import StudentLayout from "./StudentLayout";
// import { CurrentUser } from "../types/User";
// import { studentService } from "../services/StudentService";
// import { ADMIN_NAV, GUIDE_NAV, HOD_NAV, STUDENT_NAV } from "../utils/navigation";

// export default function AppShell({ user }: { user:CurrentUser }) {
//   const [collapsed, setCollapsed] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const nav = user.role==="student" ? STUDENT_NAV : user.role==="guide" ? GUIDE_NAV : user.role==="hod" ? HOD_NAV : ADMIN_NAV;

//   return (
//     <div className="flex h-screen overflow-hidden bg-background">
//       {mobileOpen&&(
//         <div className="fixed inset-0 z-50 flex lg:hidden">
//           <div className="absolute inset-0 bg-black/50" onClick={()=>setMobileOpen(false)}/>
//           <div className="relative z-10 h-full"><Sidebar nav={nav} collapsed={false} setCollapsed={()=>{}}/></div>
//         </div>
//       )}
//       <div className="hidden lg:flex h-full"><Sidebar nav={nav} collapsed={collapsed} setCollapsed={setCollapsed}/></div>
//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <Topbar nav={nav} onMenu={()=>setMobileOpen(true)} showSearch={user.role!=="guide"}/>
//         <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 scrollbar-hide">
//           {user.role==="student" ? <StudentLayout/> : user.role==="guide" ? <GuideLayout/> : user.role==="hod" ? <HodLayout/> : <AdminLayout/>}
//         </main>
//       </div>
//       <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}body{font-family:'Inter',system-ui,sans-serif}`}</style>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AdminLayout from "./AdminLayout";
import GuideLayout from "./GuideLayout";
import HodLayout from "./HodLayout";
import StudentLayout from "./StudentLayout";
import { CurrentUser } from "../types/User";
import {
  ADMIN_NAV,
  GUIDE_NAV,
  HOD_NAV,
  STUDENT_NAV,
} from "../utils/navigation";
import { studentService } from "../services/StudentService";

export default function AppShell({ user }: { user: CurrentUser }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [studentCounts, setStudentCounts] = useState({
    meetings: 0,
    guideComments: 0,
    notifications: 0,
  });

  useEffect(() => {
    if (user.role !== "student") return;

    const loadStudentCounts = async () => {
      try {
        const [meetings, notifications] = await Promise.all([
          studentService.getMyMeetings(),
          studentService.getUnreadCount(),
        ]);

        setStudentCounts({
          meetings: meetings.length,
          guideComments: 0,
          notifications,
        });
      } catch (error) {
        console.error("Failed to load student sidebar counts:", error);
      }
    };

    loadStudentCounts();
  }, [user.role]);

  const nav =
    user.role === "student"
      ? STUDENT_NAV.map((item) => {
          if (item.id === "meetings") {
            return {
              ...item,
              badge:
                studentCounts.meetings > 0
                  ? String(studentCounts.meetings)
                  : null,
            };
          }

          if (item.id === "guide-comments") {
            return {
              ...item,
              badge:
                studentCounts.guideComments > 0
                  ? String(studentCounts.guideComments)
                  : null,
            };
          }

          if (item.id === "notifications") {
            return {
              ...item,
              badge:
                studentCounts.notifications > 0
                  ? String(studentCounts.notifications)
                  : null,
            };
          }

          return item;
        })
      : user.role === "guide"
        ? GUIDE_NAV
        : user.role === "hod"
          ? HOD_NAV
          : ADMIN_NAV;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative z-10 h-full">
            <Sidebar
              nav={nav}
              collapsed={false}
              setCollapsed={() => {}}
            />
          </div>
        </div>
      )}

      <div className="hidden lg:flex h-full">
        <Sidebar
          nav={nav}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          nav={nav}
          onMenu={() => setMobileOpen(true)}
          showSearch={user.role !== "guide"}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 scrollbar-hide">
          {user.role === "student" ? (
            <StudentLayout />
          ) : user.role === "guide" ? (
            <GuideLayout />
          ) : user.role === "hod" ? (
            <HodLayout />
          ) : (
            <AdminLayout />
          )}
        </main>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        body {
          font-family: 'Inter', system-ui, sans-serif;
        }
      `}</style>
    </div>
  );
}