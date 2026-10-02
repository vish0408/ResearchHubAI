import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { studentService } from "../../services/StudentService";
import type { Project } from "../../types/Student";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import SectionHead from "../../components/common/SectionHead";

export default function StudentMyResearch() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetEndDate: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const paged = await studentService.getMyProjects();
        const items = paged.items ?? [];

        setProjects(items);
        setSelectedProject(items[0] ?? null);
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Failed to load research projects"
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!form.title.trim()) {
      setError("Project title is required");
      return;
    }

    try {
      setError("");

      const project = await studentService.createProject({
        title: form.title.trim(),
        description: form.description.trim(),
        targetEndDate: form.targetEndDate || undefined,
      });

      const updatedProjects = [project, ...projects];
      setProjects(updatedProjects);
      setSelectedProject(project);
      setShowCreate(false);
      setForm({
        title: "",
        description: "",
        targetEndDate: "",
      });
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to create project"
      );
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      setError("");

      await studentService.deleteProject(projectId);

      const remaining = projects.filter((project) => project.id !== projectId);
      setProjects(remaining);

      if (selectedProject?.id === projectId) {
        setSelectedProject(remaining[0] ?? null);
      }
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to delete project"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          My Research Projects
        </h1>

        <button
          type="button"
          onClick={() => {
            setError("");
            setShowCreate(true);
          }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      {showCreate && (
        <Card>
          <SectionHead title="Create Project" />

          <div className="flex flex-col gap-3 mt-3">
            <input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Project title"
            />

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Description"
              rows={3}
            />

            <input
              type="date"
              value={form.targetEndDate}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  targetEndDate: e.target.value,
                }))
              }
              className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleCreateProject()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Create
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setForm({
                    title: "",
                    description: "",
                    targetEndDate: "",
                  });
                }}
                className="bg-muted text-muted-foreground text-xs font-bold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">
            No projects yet. Create your first research project.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {projects.map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`flex-shrink-0 text-left p-3 rounded-xl border transition-all ${
                  selectedProject?.id === project.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-border hover:border-blue-300"
                }`}
              >
                <p className="text-sm font-bold text-foreground truncate max-w-[200px]">
                  {project.title}
                </p>

                <Badge
                  variant={
                    project.status === "Completed"
                      ? "success"
                      : project.status === "InProgress"
                        ? "default"
                        : "outline"
                  }
                >
                  {project.status}
                </Badge>

                <p className="text-xs text-muted-foreground mt-1">
                  {project.completionPercentage}% complete
                </p>
              </button>
            ))}
          </div>

          {selectedProject && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedProject.title}
                  </h2>

                  {selectedProject.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedProject.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleDeleteProject(selectedProject.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  Status:
                  <Badge
                    variant={
                      selectedProject.status === "Completed"
                        ? "success"
                        : "default"
                    }
                  >
                    {selectedProject.status}
                  </Badge>
                </span>

                <span>
                  Progress: {selectedProject.completionPercentage}%
                </span>

                <span>
                  Members: {selectedProject.members?.length || 0}
                </span>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
