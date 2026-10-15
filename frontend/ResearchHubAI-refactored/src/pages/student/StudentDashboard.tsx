// import { useEffect, useState } from "react";
// import {
//   Check,
//   Clock,
//   FileText,
//   TrendingUp,
//   Plus,
//   X,
// } from "lucide-react";
// import StatCard from "../../components/cards/StatCard";
// import Badge from "../../components/common/Badge";
// import Card from "../../components/common/Card";
// import SectionHead from "../../components/common/SectionHead";
// import { useApp } from "../../context/AppContext";
// import { studentService } from "../../services/StudentService";
// import { DashboardData } from "../../types/Student";

// export default function StudentDashboard() {
//   const { user } = useApp();

//   const [data, setData] = useState<DashboardData | null>(null);
//   const [loading, setLoading] = useState(true);

//   // New Project
//   const [showCreate, setShowCreate] = useState(false);
//   const [creating, setCreating] = useState(false);
//   const [error, setError] = useState("");

//   const [form, setForm] = useState({
//     title: "",
//     description: "",
//     targetEndDate: "",
//   });

//   const loadDashboard = async () => {
//     try {
//       const dashboard = await studentService.getDashboard();
//       setData(dashboard);
//     } catch {
//       setError("Failed to load dashboard");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     void loadDashboard();
//   }, []);

//   const handleCreateProject = async () => {
//     if (!form.title.trim()) {
//       setError("Project title is required");
//       return;
//     }

//     try {
//       setCreating(true);
//       setError("");

//       await studentService.createProject({
//         title: form.title.trim(),
//         description: form.description.trim(),
//         targetEndDate: form.targetEndDate || undefined,
//       });

//       // Reset form
//       setForm({
//         title: "",
//         description: "",
//         targetEndDate: "",
//       });

//       // Close form
//       setShowCreate(false);

//       // Reload dashboard so newly created project appears
//       setLoading(true);
//       await loadDashboard();
//     } catch (e: unknown) {
//       setError(
//         e instanceof Error
//           ? e.message
//           : "Failed to create research project"
//       );
//     } finally {
//       setCreating(false);
//     }
//   };

//   const handleCloseCreate = () => {
//     if (creating) return;

//     setShowCreate(false);
//     setError("");

//     setForm({
//       title: "",
//       description: "",
//       targetEndDate: "",
//     });
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   const project = data?.currentProject;

//   return (
//     <div className="flex flex-col gap-6">

//       {/* Header */}
//       {/* <div className="flex items-center justify-between">
//          <div>
//           <h1 className="text-xl font-bold text-foreground">
//             My Research
//           </h1>

//           <p className="text-xs text-muted-foreground mt-1">
//             Manage your research project
//           </p>
//         </div> 

//          New Project 
//          <button
//           type="button"
//           onClick={() => {
//             setError("");
//             setShowCreate(true);
//           }}
//           className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
//         >
//           <Plus className="w-3.5 h-3.5" />
//           New Project
//         </button> 
//       </div> */}

//       {/* Create Project */}
//       {showCreate && (
//         <Card>
//           <div className="flex items-center justify-between mb-4">
//             <SectionHead title="Create Project" />

//             <button
//               type="button"
//               onClick={handleCloseCreate}
//               disabled={creating}
//               className="p-1.5 rounded-lg hover:bg-muted transition-colors"
//             >
//               <X className="w-4 h-4 text-muted-foreground" />
//             </button>
//           </div>

//           {error && (
//             <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">
//               {error}
//             </div>
//           )}

//           <div className="flex flex-col gap-3">

//             {/* Title */}
//             <div>
//               <label className="block text-xs font-semibold text-foreground mb-1.5">
//                 Project Title
//               </label>

//               <input
//                 value={form.title}
//                 onChange={(e) =>
//                   setForm((prev) => ({
//                     ...prev,
//                     title: e.target.value,
//                   }))
//                 }
//                 className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
//                 placeholder="Enter project title"
//                 disabled={creating}
//               />
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block text-xs font-semibold text-foreground mb-1.5">
//                 Description
//               </label>

//               <textarea
//                 value={form.description}
//                 onChange={(e) =>
//                   setForm((prev) => ({
//                     ...prev,
//                     description: e.target.value,
//                   }))
//                 }
//                 className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
//                 placeholder="Enter project description"
//                 rows={3}
//                 disabled={creating}
//               />
//             </div>

//             {/* Target End Date */}
//             <div>
//               <label className="block text-xs font-semibold text-foreground mb-1.5">
//                 Target End Date
//               </label>

//               <input
//                 type="date"
//                 value={form.targetEndDate}
//                 onChange={(e) =>
//                   setForm((prev) => ({
//                     ...prev,
//                     targetEndDate: e.target.value,
//                   }))
//                 }
//                 className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
//                 disabled={creating}
//               />
//             </div>

//             {/* Buttons */}
//             <div className="flex gap-2 pt-1">
//               <button
//                 type="button"
//                 onClick={() => void handleCreateProject()}
//                 disabled={creating}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
//               >
//                 {creating ? "Creating..." : "Create"}
//               </button>

//               <button
//                 type="button"
//                 onClick={handleCloseCreate}
//                 disabled={creating}
//                 className="bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </Card>
//       )}

//       {/* Error outside create form */}
//       {error && !showCreate && (
//         <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">
//           {error}
//         </div>
//       )}

//       {/* Existing Dashboard Hero */}
//       <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
//         <button
//   type="button"
//   onClick={() => {
//     setError("");
//     setShowCreate(true);
//   }}
//   className="absolute top-5 right-5 z-10 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
// >
//   <Plus className="w-3.5 h-3.5" />
//   New Project
// </button>
//         <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />

//         <div className="relative">
//           <p className="text-blue-100 text-sm mb-1">
//             Welcome back, {user?.name?.split(" ")[0]}
//           </p>

//           <h2 className="text-xl font-bold mb-1">
//             {project?.title || "No active project"}
//           </h2>

//           <p className="text-blue-100 text-sm mb-4">
//             {user?.dept || "Department"} ·{" "}
//             {user?.institution || "Institution"}
//           </p>

//           {project && (
//             <>
//               <div className="mb-3">
//                 <div className="flex items-center justify-between text-sm mb-2">
//                   <span className="text-blue-100">
//                     Project Completion
//                   </span>

//                   <span className="font-bold text-lg">
//                     {data?.completionPercentage || 0}%
//                   </span>
//                 </div>

//                 <div className="bg-white/20 rounded-full h-3">
//                   <div
//                     className="bg-white h-3 rounded-full"
//                     style={{
//                       width: `${data?.completionPercentage || 0}%`,
//                     }}
//                   />
//                 </div>
//               </div>

//               <div className="flex gap-3 flex-wrap text-xs">
//                 <div className="bg-white/15 rounded-xl px-3 py-1.5">
//                   Status: {project.status}
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         <StatCard
//           label="Completion"
//           value={`${data?.completionPercentage || 0}%`}
//           icon={TrendingUp}
//           color="bg-blue-500"
//         />

//         <StatCard
//           label="Tasks Completed"
//           value={`${data?.completedTasks || 0}`}
//           sub={`${(data?.pendingTasks || 0) + (data?.completedTasks || 0)} total`}
//           icon={Check}
//           color="bg-green-500"
//         />

//         <StatCard
//           label="Pending Tasks"
//           value={`${data?.pendingTasks || 0}`}
//           icon={Clock}
//           color="bg-amber-500"
//         />

//         <StatCard
//           label="Documents"
//           value={`${data?.recentDocuments?.length || 0}`}
//           icon={FileText}
//           color="bg-indigo-500"
//         />
//       </div>

//       {/* Milestones + Documents + Notifications */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <Card className="lg:col-span-2">
//           <SectionHead title="Upcoming Milestones" />

//           {data?.upcomingMilestones?.length ? (
//             <div className="flex flex-col gap-3">
//               {data.upcomingMilestones.map((m, i) => (
//                 <div
//                   key={m.id}
//                   className="flex items-center gap-3"
//                 >
//                   <div
//                     className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
//                       m.isCompleted
//                         ? "bg-green-100 text-green-600 dark:bg-green-900/30"
//                         : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
//                     }`}
//                   >
//                     {m.isCompleted ? (
//                       <Check className="w-3.5 h-3.5" />
//                     ) : (
//                       i + 1
//                     )}
//                   </div>

//                   <div className="flex-1 min-w-0">
//                     <p className="text-xs font-semibold text-foreground truncate">
//                       {m.title}
//                     </p>

//                     <p className="text-xs text-muted-foreground">
//                       {new Date(m.targetDate).toLocaleDateString()}
//                     </p>
//                   </div>

//                   <Badge
//                     variant={
//                       m.isCompleted ? "success" : "outline"
//                     }
//                   >
//                     {m.isCompleted ? "Done" : "Pending"}
//                   </Badge>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="text-sm text-muted-foreground">
//               No milestones yet
//             </p>
//           )}
//         </Card>

//         <div className="flex flex-col gap-4">
//           <Card>
//             <SectionHead title="Recent Documents" />

//             {data?.recentDocuments?.length ? (
//               <div className="flex flex-col gap-2">
//                 {data.recentDocuments.map((d) => (
//                   <div
//                     key={d.id}
//                     className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
//                   >
//                     <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />

//                     <div className="min-w-0 flex-1">
//                       <p className="text-xs font-medium text-foreground truncate">
//                         {d.fileName}
//                       </p>

//                       <p className="text-xs text-muted-foreground">
//                         {d.uploaderName} ·{" "}
//                         {new Date(
//                           d.uploadedAt
//                         ).toLocaleDateString()}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-sm text-muted-foreground">
//                 No documents yet
//               </p>
//             )}
//           </Card>

//           <Card>
//             <SectionHead title="Notifications" />

//             {data?.notifications?.length ? (
//               <div className="flex flex-col gap-2">
//                 {data.notifications.slice(0, 3).map((n) => (
//                   <div
//                     key={n.id}
//                     className={`p-2 rounded-lg text-xs ${
//                       n.isRead
//                         ? ""
//                         : "bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30"
//                     }`}
//                   >
//                     <p className="font-medium text-foreground">
//                       {n.title}
//                     </p>

//                     <p className="text-muted-foreground mt-0.5">
//                       {n.message}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-sm text-muted-foreground">
//                 No notifications
//               </p>
//             )}
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import {
  Check,
  Clock,
  FileText,
  TrendingUp,
  Plus,
  X,
  GraduationCap,
} from "lucide-react";
import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import SectionHead from "../../components/common/SectionHead";
import { useApp } from "../../context/AppContext";
import { studentService } from "../../services/StudentService";
import { DashboardData } from "../../types/Student";

export default function StudentDashboard() {
  const { user } = useApp();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // New Project popup
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    targetEndDate: "",
  });

  const loadDashboard = async () => {
    try {
      setError("");

      const dashboard = await studentService.getDashboard();
      setData(dashboard);
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleCreateProject = async () => {
    if (!form.title.trim()) {
      setError("Project title is required");
      return;
    }

    try {
      setCreating(true);
      setError("");

      await studentService.createProject({
        title: form.title.trim(),
        description: form.description.trim(),
        targetEndDate: form.targetEndDate || undefined,
      });

      // Reset form
      setForm({
        title: "",
        description: "",
        targetEndDate: "",
      });

      // Close popup
      setShowCreate(false);

      // Refresh dashboard
      setLoading(true);
      await loadDashboard();
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to create research project"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCloseCreate = () => {
    if (creating) return;

    setShowCreate(false);
    setError("");

    setForm({
      title: "",
      description: "",
      targetEndDate: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const project = data?.currentProject;

  return (
    <div className="flex flex-col gap-6">

      {/* Error */}
      {error && !showCreate && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">

        {/* New Project Button */}
        <button
          type="button"
          onClick={() => {
            setError("");
            setShowCreate(true);
          }}
          className="absolute top-5 right-5 z-10 flex items-center gap-1.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>

        {/* Decorative Circle */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />

        <div className="relative">
          <p className="text-blue-100 text-sm mb-1">
            Welcome back, {user?.name?.split(" ")[0]}
          </p>

          <h2 className="text-xl font-bold mb-1 pr-36">
            {project?.title || "No active project"}
          </h2>

          <p className="text-blue-100 text-sm mb-4">
            {user?.dept || "Department"} ·{" "}
            {user?.institution || "Institution"}
          </p>

          {project && (
            <>
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-blue-100">
                    Project Completion
                  </span>

                  <span className="font-bold text-lg">
                    {data?.completionPercentage || 0}%
                  </span>
                </div>

                <div className="bg-white/20 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full"
                    style={{
                      width: `${data?.completionPercentage || 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-wrap text-xs">
                <div className="bg-white/15 rounded-xl px-3 py-1.5">
                  Status: {project.status}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Completion"
          value={`${data?.completionPercentage || 0}%`}
          icon={TrendingUp}
          color="bg-blue-500"
        />

        <StatCard
          label="Tasks Completed"
          value={`${data?.completedTasks || 0}`}
          sub={`${(data?.pendingTasks || 0) + (data?.completedTasks || 0)} total`}
          icon={Check}
          color="bg-green-500"
        />

        <StatCard
          label="Pending Tasks"
          value={`${data?.pendingTasks || 0}`}
          icon={Clock}
          color="bg-amber-500"
        />

        <StatCard
          label="Documents"
          value={`${data?.recentDocuments?.length || 0}`}
          icon={FileText}
          color="bg-indigo-500"
        />

      

<StatCard
  label="Credits Score"
  value={
    data?.requiredCredits != null && data.requiredCredits > 0
      ? `${data.earnedCredits ?? 0} / ${data.requiredCredits}`
      : `${data?.earnedCredits ?? 0} Credits Earned`
  }
  icon={GraduationCap}
  color="bg-violet-500"
/>


      </div>

      {/* Upcoming Milestones + Documents + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming Milestones */}
        <Card className="lg:col-span-2">
          <SectionHead title="Upcoming Milestones" />

          {data?.upcomingMilestones?.length ? (
            <div className="flex flex-col gap-3">
              {data.upcomingMilestones.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      m.isCompleted
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                    }`}
                  >
                    {m.isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {m.title}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        m.targetDate
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <Badge
                    variant={
                      m.isCompleted
                        ? "success"
                        : "outline"
                    }
                  >
                    {m.isCompleted ? "Done" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No milestones yet
            </p>
          )}
        </Card>

        {/* Right Side */}
        <div className="flex flex-col gap-4">

          {/* Recent Documents */}
          <Card>
            <SectionHead title="Recent Documents" />

            {data?.recentDocuments?.length ? (
              <div className="flex flex-col gap-2">
                {data.recentDocuments.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {d.fileName}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {d.uploaderName} ·{" "}
                        {new Date(
                          d.uploadedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No documents yet
              </p>
            )}
          </Card>

          {/* Notifications */}
          <Card>
            <SectionHead title="Notifications" />

            {data?.notifications?.length ? (
              <div className="flex flex-col gap-2">
                {data.notifications
                  .slice(0, 3)
                  .map((n) => (
                    <div
                      key={n.id}
                      className={`p-2 rounded-lg text-xs ${
                        n.isRead
                          ? ""
                          : "bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30"
                      }`}
                    >
                      <p className="font-medium text-foreground">
                        {n.title}
                      </p>

                      <p className="text-muted-foreground mt-0.5">
                        {n.message}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No notifications
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* =====================================================
          CREATE NEW PROJECT POPUP
          ===================================================== */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={handleCloseCreate}
        >
          <div
            className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border p-5"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Popup Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Create New Project
                </h2>

                <p className="text-xs text-muted-foreground mt-1">
                  Add your research project details
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseCreate}
                disabled={creating}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Popup Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Form */}
            <div className="flex flex-col gap-4">

              {/* Project Title */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Project Title
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter project title"
                  disabled={creating}
                  className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter project description"
                  rows={3}
                  disabled={creating}
                  className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Target End Date */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Target End Date
                </label>

                <input
                  type="date"
                  value={form.targetEndDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      targetEndDate: e.target.value,
                    }))
                  }
                  disabled={creating}
                  className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={handleCloseCreate}
                  disabled={creating}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleCreateProject()}
                  disabled={creating}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all"
                >
                  {creating ? "Creating..." : "Create"}
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}