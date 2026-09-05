import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Users,
  ListChecks,
  Flag,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { studentService } from "../../services/StudentService";
import { Project, TaskItem, Milestone, ProjectDocument } from "../../types/Student";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import SectionHead from "../../components/common/SectionHead";

type Tab = "tasks" | "milestones" | "documents" | "members";

export default function StudentMyResearch() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("tasks");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", targetEndDate: "" });

  useEffect(() => {
    studentService.getMyProjects()
      .then((paged) => {
        const items = paged.items;
        setProjects(items);
        if (items.length > 0) setSelectedProject(items[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    if (tab === "tasks") {
      studentService.getTasks(selectedProject.id).then(setTasks).catch(() => {});
    } else if (tab === "milestones") {
      studentService.getMilestones(selectedProject.id).then(setMilestones).catch(() => {});
    } else if (tab === "documents") {
      studentService.getDocuments(selectedProject.id).then(setDocuments).catch(() => {});
    }
  }, [selectedProject, tab]);

  const handleCreateProject = async () => {
    try {
      const p = await studentService.createProject({
        title: form.title,
        description: form.description,
        targetEndDate: form.targetEndDate || undefined,
      });
      setProjects([p, ...projects]);
      setSelectedProject(p);
      setShowCreate(false);
      setForm({ title: "", description: "", targetEndDate: "" });
    } catch { }
  };

//   const handlePreview = async (docId: string, fileType: string) => {
//   try {
//     if (fileType.toLowerCase().includes("pdf")) {
//       const blob = await studentService.previewDocument(projectId, docId);

//       const url = window.URL.createObjectURL(blob);
//       window.open(url, "_blank");

//       setTimeout(() => {
//         window.URL.revokeObjectURL(url);
//       }, 60000);
//     } else {
//       alert("Preview is currently available only for PDF documents.");
//     }
//   } catch (error) {
//     console.error("Preview failed:", error);
//     alert("Unable to preview this document.");
//   }
// };

{/* <button
  onClick={() => handlePreview(d.id, d.fileType)}
  className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg"
  title="Preview"
>
  <Eye className="w-4 h-4" />
</button> */}

  const handleDeleteProject = async (id: string) => {
    try {
      await studentService.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(projects[0] || null);
    } catch { }
  };

  const tabs: { key: Tab; label: string; icon: typeof ListChecks }[] = [
    { key: "tasks", label: "Tasks", icon: ListChecks },
    { key: "milestones", label: "Milestones", icon: Flag },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "members", label: "Team", icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">My Research Projects</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">
          <Plus className="w-3.5 h-3.5" /> New Project
        </button>
      </div>

      {showCreate && (
        <Card>
          <SectionHead title="Create Project" />
          <div className="flex flex-col gap-3 mt-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Project title" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Description" rows={3} />
            <input type="date" value={form.targetEndDate} onChange={(e) => setForm({ ...form, targetEndDate: e.target.value })}
              className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl">Create</button>
              <button onClick={() => setShowCreate(false)} className="bg-muted text-muted-foreground text-xs font-bold px-4 py-2 rounded-xl">Cancel</button>
            </div>
          </div>
        </Card>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No projects yet. Create your first research project.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {projects.map((p) => (
              <button key={p.id} onClick={() => setSelectedProject(p)}
                className={`flex-shrink-0 text-left p-3 rounded-xl border transition-all ${selectedProject?.id === p.id ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-border hover:border-blue-300"}`}>
                <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{p.title}</p>
                <Badge variant={p.status === "Completed" ? "success" : p.status === "InProgress" ? "default" : "outline"}>{p.status}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{p.completionPercentage}% complete</p>
              </button>
            ))}
          </div>

          {selectedProject && (
            <>
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedProject.title}</h2>
                    <p className="text-xs text-muted-foreground">{selectedProject.description}</p>
                  </div>
                  <button onClick={() => handleDeleteProject(selectedProject.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Status: <Badge variant={selectedProject.status === "Completed" ? "success" : "default"}>{selectedProject.status}</Badge></span>
                  <span>Progress: {selectedProject.completionPercentage}%</span>
                  <span>Members: {selectedProject.members?.length || 0}</span>
                </div>
              </Card>

              <div className="flex gap-1 bg-muted rounded-xl p-1">
                {tabs.map((t) => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                ))}
              </div>

              {tab === "tasks" && <TaskTab projectId={selectedProject.id} tasks={tasks} />}
              {tab === "milestones" && <MilestoneTab projectId={selectedProject.id} milestones={milestones} />}
              {tab === "documents" && <DocumentTab projectId={selectedProject.id} documents={documents} />}
              {tab === "members" && <MemberTab project={selectedProject} />}
            </>
          )}
        </>
      )}
    </div>
  );
}

function TaskTab({ projectId, tasks }: { projectId: string; tasks: TaskItem[] }) {
  const [items, setItems] = useState(tasks);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium" });

  useEffect(() => { setItems(tasks); }, [tasks]);

  const handleCreate = async () => {
    try {
      const t = await studentService.createTask(projectId, form);
      setItems([t, ...items]);
      setShowForm(false);
      setForm({ title: "", description: "", priority: "Medium" });
    } catch { }
  };

  const handleToggleStatus = async (task: TaskItem) => {
    const newStatus = task.status === "Completed" ? "NotStarted" : "Completed";
    try {
      const updated = await studentService.updateTask(projectId, task.id, { ...task, status: newStatus });
      setItems(items.map((i) => (i.id === task.id ? updated : i)));
    } catch { }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "Critical": return "text-red-500";
      case "High": return "text-orange-500";
      case "Medium": return "text-amber-500";
      default: return "text-green-500";
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <SectionHead title="Tasks" />
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
          <Plus className="w-3 h-3" /> Add Task
        </button>
      </div>

      {showForm && (
        <div className="flex flex-col gap-2 mb-4 p-3 bg-muted rounded-xl">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none" placeholder="Task title" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none" placeholder="Description" rows={2} />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none">
            <option value="Low">Low</option><option value="Medium">Medium</option>
            <option value="High">High</option><option value="Critical">Critical</option>
          </select>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">Add</button>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((task) => (
            <label key={task.id} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input type="checkbox" checked={task.status === "Completed"} onChange={() => handleToggleStatus(task)} className="w-4 h-4 mt-0.5 accent-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${task.status === "Completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                {task.dueDate && <p className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
              </div>
              <span className={`text-xs font-bold ${priorityColor(task.priority)}`}>{task.priority}</span>
            </label>
          ))}
        </div>
      )}
    </Card>
  );
}

function MilestoneTab({ projectId, milestones }: { projectId: string; milestones: Milestone[] }) {
  const [items, setItems] = useState(milestones);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", targetDate: "" });

  useEffect(() => { setItems(milestones); }, [milestones]);

  const handleCreate = async () => {
    try {
      const m = await studentService.createMilestone(projectId, { ...form, targetDate: new Date(form.targetDate).toISOString() } as any);
      setItems([...items, m]);
      setShowForm(false);
      setForm({ title: "", description: "", targetDate: "" });
    } catch { }
  };

  const handleToggle = async (milestone: Milestone) => {
    try {
      const updated = await studentService.updateMilestone(projectId, milestone.id, { ...milestone, isCompleted: !milestone.isCompleted });
      setItems(items.map((m) => (m.id === milestone.id ? updated : m)));
    } catch { }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <SectionHead title="Milestones" />
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs font-bold text-blue-600">
          <Plus className="w-3 h-3" /> Add Milestone
        </button>
      </div>
      {showForm && (
        <div className="flex flex-col gap-2 mb-4 p-3 bg-muted rounded-xl">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none" placeholder="Milestone title" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none" placeholder="Description" />
          <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">Add</button>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No milestones yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <input type="checkbox" checked={m.isCompleted} onChange={() => handleToggle(m)} className="w-4 h-4 accent-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className={`text-xs font-medium ${m.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>{m.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(m.targetDate).toLocaleDateString()}</p>
              </div>
              <Badge variant={m.isCompleted ? "success" : "outline"}>{m.isCompleted ? "Done" : "Pending"}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DocumentTab({
  projectId,
  documents,
}: {
  projectId: string;
  documents: ProjectDocument[];
}) {
  const [items, setItems] = useState(documents);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(documents);
  }, [documents]);

  // Preview document
  const handlePreview = async (doc: ProjectDocument) => {
    try {
      setLoadingId(doc.id);

      // PDF can be previewed directly in browser

      // if (doc.fileType?.toLowerCase() === "pdf") {
      if (doc.fileType?.toLowerCase().includes("pdf")) {
        // const blob = await studentService.previewDocument(projectId, doc.id);
        // const url = window.URL.createObjectURL(blob);

        const result = await studentService.previewDocument(projectId, doc.id);
const url = window.URL.createObjectURL(result.data);

        window.open(url, "_blank");

        // Give the new tab time to load before revoking
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 60000);
      } else {
        // DOC/DOCX cannot reliably preview directly in browser.
        // For those, download instead.
        await handleDownload(doc);
      }
    } catch (error) {
      console.error("Preview failed:", error);
      alert("Unable to preview this document.");
    } finally {
      setLoadingId(null);
    }
  };

  // Download document
  const handleDownload = async (doc: ProjectDocument) => {
  try {
    setLoadingId(doc.id);

    const result = await studentService.downloadDocument(projectId, doc.id);

    const url = window.URL.createObjectURL(result.data);

    const link = document.createElement("a");
    link.href = url;
    link.download = result.fileName || doc.fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Unable to download this document.");
  } finally {
    setLoadingId(null);
  }
};

  // Delete document
  const handleDelete = async (docId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmed) return;

    try {
      setLoadingId(docId);

      await studentService.deleteDocument(projectId, docId);

      setItems((prev) => prev.filter((d) => d.id !== docId));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Unable to delete this document.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionHead title="Documents" />

        <span className="text-xs text-muted-foreground">
          {items.length} document{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />

          <p className="text-sm text-muted-foreground">
            No documents uploaded yet
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Upload your research documents from the Thesis Upload page.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((d) => {
            const fileType = d.fileType?.toLowerCase() || "";

            return (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors"
              >
                {/* File icon */}
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-border flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>

                {/* File information */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {d.fileName}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {fileType.toUpperCase()} ·{" "}
                    {(d.fileSize / 1024).toFixed(1)} KB · {d.uploaderName}
                  </p>
                </div>

                {/* Upload date */}
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {new Date(d.uploadedAt).toLocaleDateString()}
                </span>

                {/* Preview */}
                <button
                  onClick={() => handlePreview(d)}
                  disabled={loadingId === d.id}
                  title={
                    fileType === "pdf"
                      ? "Preview"
                      : "DOC/DOCX preview is not supported in browser"
                  }
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Download */}
                <button
                  onClick={() => handleDownload(d)}
                  disabled={loadingId === d.id}
                  title="Download"
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={loadingId === d.id}
                  title="Delete"
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// function DocumentTab({ projectId, documents }: { projectId: string; documents: ProjectDocument[] }) {
//   const [items, setItems] = useState(documents);
//   const [showForm, setShowForm] = useState(false);
//   const [form, setForm] = useState({ fileName: "", fileType: "", fileSize: 0 });

//   useEffect(() => { setItems(documents); }, [documents]);

//   const handleCreate = async () => {
//     try {
//       const d = await studentService.createDocument(projectId, form);
//       setItems([d, ...items]);
//       setShowForm(false);
//       setForm({ fileName: "", fileType: "", fileSize: 0 });
//     } catch { }
//   };

//   const handleDelete = async (docId: string) => {
//     try {
//       await studentService.deleteDocument(projectId, docId);
//       setItems(items.filter((d) => d.id !== docId));
//     } catch { }
//   };

//   return (
//     <Card>
//       <div className="flex items-center justify-between mb-3">
//         <SectionHead title="Documents" />
//         <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs font-bold text-blue-600">
//           <Plus className="w-3 h-3" /> Add Document
//         </button>
//       </div>
//       {showForm && (
//         <div className="flex flex-col gap-2 mb-4 p-3 bg-muted rounded-xl">
//           <input value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })}
//             className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none" placeholder="File name" />
//           <input value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })}
//             className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none" placeholder="File type (e.g., pdf, docx)" />
//           <input type="number" value={form.fileSize || ""} onChange={(e) => setForm({ ...form, fileSize: parseInt(e.target.value) || 0 })}
//             className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none" placeholder="File size (bytes)" />
//           <div className="flex gap-2">
//             <button onClick={handleCreate} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">Add</button>
//             <button onClick={() => setShowForm(false)} className="text-muted-foreground text-xs px-3 py-1.5">Cancel</button>
//           </div>
//         </div>
//       )}
//       {items.length === 0 ? (
//         <p className="text-sm text-muted-foreground">No documents yet</p>
//       ) : (
//         <div className="flex flex-col gap-2">
//           {items.map((d) => (
//             <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
//               <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
//               <div className="flex-1 min-w-0">
//                 <p className="text-xs font-medium text-foreground truncate">{d.fileName}</p>
//                 <p className="text-xs text-muted-foreground">{d.fileType} · {(d.fileSize / 1024).toFixed(1)} KB · {d.uploaderName}</p>
//               </div>
//               <span className="text-xs text-muted-foreground">{new Date(d.uploadedAt).toLocaleDateString()}</span>
//               <button onClick={() => handleDelete(d.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg">
//                 <Trash2 className="w-3 h-3" />
//               </button>
//             </div>
//           ))}
//         </div>
//       )}
//     </Card>
//   );
// }

function MemberTab({ project }: { project: Project }) {
  return (
    <Card>
      <SectionHead title="Team Members" />
      {project.members?.length ? (
        <div className="flex flex-col gap-2 mt-3">
          {project.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600">
                {m.userName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">{m.userName}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <Badge variant={m.role === "Leader" ? "default" : "outline"}>{m.role}</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-3">No team members yet</p>
      )}
    </Card>
  );
}
