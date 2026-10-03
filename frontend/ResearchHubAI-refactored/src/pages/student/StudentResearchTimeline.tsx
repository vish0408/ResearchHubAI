import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  ListChecks,
  Flag,
  ChevronDown,
  Plus,
} from "lucide-react";

import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import SectionHead from "../../components/common/SectionHead";

import { studentService } from "../../services/StudentService";
import type { Milestone, TaskItem } from "../../types/Student";

type TimelineTab = "milestones" | "tasks";
type TimelineTask = TaskItem & { milestoneId?: string | null };

export default function StudentResearchTimeline() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const [activeTab, setActiveTab] =
    useState<TimelineTab>("milestones");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState("");
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);
  const [taskMilestoneId, setTaskMilestoneId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
  });
  const [savingTask, setSavingTask] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    targetDate: "",
  });
  const [savingMilestone, setSavingMilestone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const paged = await studentService.getMyProjects();
        const project = paged.items[0];

        if (project) {
          setProjectId(project.id);

          const [milestoneList, taskList] = await Promise.all([
            studentService.getMilestones(project.id),
            studentService.getTasks(project.id),
          ]);

          setMilestones(milestoneList);
          setTasks(taskList);
        }
      } catch (e: unknown) {
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load research timeline"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const typedTasks = tasks as TimelineTask[];
  const assignedTasks = typedTasks.filter((task) => !!task.milestoneId);

  const getMilestoneTasks = (milestoneId: string) =>
    assignedTasks.filter((task) => task.milestoneId === milestoneId);

  const getMilestoneProgress = (milestoneId: string) => {
    const milestoneTasks = getMilestoneTasks(milestoneId);
    const completed = milestoneTasks.filter(
      (task) => task.status.toLowerCase() === "completed"
    ).length;
    const total = milestoneTasks.length;

    if (total === 0) return { completed, total, status: "Pending" };
    if (completed === total) return { completed, total, status: "Completed" };
    if (completed > 0) return { completed, total, status: "In Progress" };
    return { completed, total, status: "Pending" };
  };


  const openTaskForm = (milestoneId?: string) => {
    const targetMilestoneId =
      milestoneId ?? expandedMilestoneId ?? milestones[0]?.id ?? null;

    setTaskMilestoneId(targetMilestoneId);
    setShowTaskForm(true);
    setExpandedMilestoneId(targetMilestoneId);
    setError("");
  };

  const handleCreateMilestone = async () => {
    if (!projectId) {
      setError("Project context is not available");
      return;
    }

    if (!milestoneForm.title.trim()) {
      setError("Milestone title is required");
      return;
    }

    if (!milestoneForm.targetDate) {
      setError("Milestone target date is required");
      return;
    }

    try {
      setSavingMilestone(true);
      setError("");

      const created = await studentService.createMilestone(projectId, {
        title: milestoneForm.title.trim(),
        description: milestoneForm.description.trim(),
        targetDate: new Date(milestoneForm.targetDate).toISOString(),
        isCompleted: false,
      } as Partial<Milestone>);

      setMilestones((current) => [...current, created]);
      setExpandedMilestoneId(created.id);
      setShowMilestoneForm(false);
      setMilestoneForm({
        title: "",
        description: "",
        targetDate: "",
      });
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to create milestone"
      );
    } finally {
      setSavingMilestone(false);
    }
  };

  const closeTaskForm = () => {
    setShowTaskForm(false);
    setTaskMilestoneId(null);
    setTaskForm({ title: "", description: "", priority: "Medium" });
  };

  const handleCreateTask = async () => {
    if (!projectId) {
      setError("Project context is not available");
      return;
    }

    if (!taskMilestoneId) {
      setError("Please select a milestone first");
      return;
    }

    if (!taskForm.title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setSavingTask(true);
      setError("");

      const created = await studentService.createTask(
        projectId,
        {
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          priority: taskForm.priority,
          milestoneId: taskMilestoneId,
        } as Partial<TaskItem>
      );

      const createdWithMilestone = {
        ...created,
        milestoneId: taskMilestoneId,
      } as TimelineTask;

      setTasks((current) => [createdWithMilestone, ...current]);
      setExpandedMilestoneId(taskMilestoneId);
      closeTaskForm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setSavingTask(false);
    }
  };

  const handleToggleTask = async (task: TimelineTask) => {
    if (!projectId) return;

    const currentStatus = task.status.toLowerCase();
    const newStatus =
      currentStatus === "completed" ? "NotStarted" : "Completed";

    try {
      const updated = await studentService.updateTask(projectId, task.id, {
        ...task,
        status: newStatus,
      });

      const updatedWithMilestone = {
        ...updated,
        milestoneId: task.milestoneId,
      } as TimelineTask;

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? updatedWithMilestone : item
        )
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update task");
    }
  };

  /*
 * Statistics
 * Summary is based on milestones,
 * not individual tasks.
 */

const totalMilestones = milestones.length;

const completedMilestones = milestones.filter((milestone) => {
  const progress = getMilestoneProgress(milestone.id);
  return progress.status === "Completed";
}).length;

const inProgressMilestones = milestones.filter((milestone) => {
  const progress = getMilestoneProgress(milestone.id);
  return progress.status === "In Progress";
}).length;

const pendingMilestones =
  totalMilestones -
  completedMilestones -
  inProgressMilestones;

const overall =
  totalMilestones > 0
    ? Math.round(
        (completedMilestones / totalMilestones) * 100
      )
    : 0;

    
  /*
   * Sort milestones by target date.
   */
  const sortedMilestones = milestones
    .slice()
    .sort(
      (a, b) =>
        new Date(a.targetDate).getTime() -
        new Date(b.targetDate).getTime()
    );

  return (
    <div className="flex flex-col gap-6">

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        <StatCard
          label="Done"
          value={`${completedMilestones} / ${totalMilestones}`}
          icon={CheckCircle}
          color="bg-green-500"
        />

        <StatCard
          label="In Progress"
          value={`${inProgressMilestones}`}
          icon={RefreshCw}
          color="bg-blue-500"
        />

        <StatCard
          label="Pending"
          value={`${pendingMilestones}`}
          icon={Clock}
          color="bg-amber-500"
        />

        <StatCard
          label="Overall"
          value={`${overall}%`}
          icon={TrendingUp}
          color="bg-indigo-500"
        />

      </div>

      {/* Main Timeline Card */}
      <Card>

        {/* Header + Tabs */}
        <div className="flex items-center justify-between mb-5">

          <SectionHead
            title={
              activeTab === "milestones"
                ? "Research Milestones"
                : "Research Tasks"
            }
          />

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">

            {/* Milestones */}
            <button
              onClick={() =>
                setActiveTab("milestones")
              }
              className={`
                flex items-center gap-1.5
                px-4 py-2
                rounded-lg
                text-xs
                font-bold
                transition-all
                ${
                  activeTab === "milestones"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <Flag className="w-3.5 h-3.5" />
              Milestones
            </button>

            {/* Tasks */}
            <button
              onClick={() =>
                setActiveTab("tasks")
              }
              className={`
                flex items-center gap-1.5
                px-4 py-2
                rounded-lg
                text-xs
                font-bold
                transition-all
                ${
                  activeTab === "tasks"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <ListChecks className="w-3.5 h-3.5" />
              Tasks
            </button>

          </div>
        </div>

        {/* ========================= */}
        {/* MILESTONES */}
        {/* ========================= */}

        {activeTab === "milestones" && (
          <>
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No milestones yet
              </p>
            ) : (
              <div className="flex flex-col">

                {sortedMilestones.map((m, i) => {
               const progress = getMilestoneProgress(m.id);

                  return (
                  <div
                    key={m.id}
                    className="flex gap-4 pb-5 last:pb-0"
                  >

                    {/* Timeline icon */}
                    <div className="flex flex-col items-center">

                      <div
                        className={`
                          w-9 h-9
                          rounded-full
                          flex items-center justify-center
                          flex-shrink-0
                          z-10
                          border-2
                          ${
                            progress.status === "Completed"
                           ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                              : progress.status === "In Progress"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                           : "border-border bg-muted"
                          }
                        `}
                      >
                        {progress.status === "Completed" ? (
                       <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : progress.status === "In Progress" ? (
                         <RefreshCw className="w-4 h-4 text-blue-600" />
                          ) : (
                         <Clock className="w-4 h-4 text-muted-foreground" />
                         )}  
                      </div>

                      {i < sortedMilestones.length - 1 && (
                        <div
                          className={`
                            w-0.5
                            flex-1
                            mt-1
                            ${
                             progress.status === "Completed"
                           ? "bg-green-200 dark:bg-green-900/50"
                          : "bg-border"
                            }
                          `}
                        />
                      )}

                    </div>

                    {/* Milestone content */}
                    <div className="flex-1 pb-1">

                      <div className="flex items-center justify-between flex-wrap gap-1">

                        <span className="font-bold text-sm text-foreground">
                          {m.title}
                        </span>

                        <Badge
                        variant={
                        progress.status === "Completed"
                      ? "success"
                      : "outline"
                          }
                          >
                       {progress.status}
                       </Badge>
                      </div>

                      {m.description && (
                        <p className="text-xs text-muted-foreground">
                          {m.description}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(
                          m.targetDate
                        ).toLocaleDateString()}
                      </p>

                    </div>

                  </div>
                )})}

              </div>
            )}
          </>
        )}

        {/* ========================= */}
        {/* TASKS */}
        {/* ========================= */}

        {activeTab === "tasks" && (
          <div className="space-y-4">
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Flag className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-base font-bold text-foreground">
                      Milestones
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Create a milestone and manage its tasks
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setShowMilestoneForm((current) => !current);
                  }}
                  className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                  aria-label="Add new milestone"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {showMilestoneForm && (
                <div className="border-t border-border px-5 py-4 bg-muted/20">
                  <div className="space-y-3">
                    <input
                      value={milestoneForm.title}
                      onChange={(e) =>
                        setMilestoneForm((current) => ({
                          ...current,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Milestone title"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    />

                    <textarea
                      value={milestoneForm.description}
                      onChange={(e) =>
                        setMilestoneForm((current) => ({
                          ...current,
                          description: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Milestone description"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-500"
                    />

                    <input
                      type="date"
                      value={milestoneForm.targetDate}
                      onChange={(e) =>
                        setMilestoneForm((current) => ({
                          ...current,
                          targetDate: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMilestoneForm(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-border bg-background text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleCreateMilestone()}
                        disabled={savingMilestone}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingMilestone ? "Adding..." : "Add Milestone"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-border">
                {sortedMilestones.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No milestones yet. Use the + button to create one.
                  </div>
                ) : (
                  sortedMilestones.map((milestone) => {
                    const progress = getMilestoneProgress(milestone.id);
                    const milestoneTasks = getMilestoneTasks(milestone.id)
                      .slice()
                      .sort((a, b) => {
                        if (!a.dueDate && !b.dueDate) return 0;
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return (
                          new Date(a.dueDate).getTime() -
                          new Date(b.dueDate).getTime()
                        );
                      });

                    const expanded =
                      expandedMilestoneId === milestone.id;

                    return (
                      <div
                        key={milestone.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMilestoneId((current) =>
                              current === milestone.id ? null : milestone.id
                            )
                          }
                          className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                        >
                          <span
                            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              progress.status === "Completed"
                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                : progress.status === "In Progress"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                : "border-border bg-muted/40"
                            }`}
                          >
                            {progress.status === "Completed" ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : progress.status === "In Progress" ? (
                              <RefreshCw className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-muted-foreground" />
                            )}
                          </span>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">
                              {milestone.title}
                            </p>

                            <p className="text-xs text-muted-foreground mt-0.5">
                              {progress.completed} / {progress.total} tasks completed
                            </p>

                            <p className="text-[11px] text-muted-foreground mt-1">
                              {new Date(
                                milestone.targetDate
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          {/* <Badge
                            variant={
                              progress.status === "Completed"
                                ? "success"
                                : progress.status === "In Progress"
                                ? "default"
                                : "outline"
                            }
                          >
                            {progress.status}
                          </Badge> */}

                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform ${
                              expanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {expanded && (
                          <div className="px-5 pb-4">
                            {milestoneTasks.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2">
                                No tasks added to this milestone yet.
                              </p>
                            ) : (
                              <div className="space-y-2 mb-3">
                                {milestoneTasks.map((task) => {
                                  const completed =
                                    task.status.toLowerCase() === "completed";

                                  return (
                                    <label
                                      key={task.id}
                                      className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={completed}
                                        onChange={() =>
                                          void handleToggleTask(task)
                                        }
                                        className="w-4 h-4 mt-0.5 accent-blue-600 flex-shrink-0"
                                      />

                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={`text-sm font-semibold ${
                                            completed
                                              ? "line-through text-muted-foreground"
                                              : "text-foreground"
                                          }`}
                                        >
                                          {task.title}
                                        </p>

                                        {task.description && (
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {task.description}
                                          </p>
                                        )}

                                        <div className="flex items-center gap-3 mt-1.5">
                                          <span className="text-[11px] text-muted-foreground">
                                            Priority: {task.priority}
                                          </span>

                                          {task.dueDate && (
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              {new Date(
                                                task.dueDate
                                              ).toLocaleDateString()}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <span className="text-[11px] font-bold text-muted-foreground">
                                        {completed ? "Done" : "Pending"}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => openTaskForm(milestone.id)}
                              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/40 dark:bg-blue-950/20 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add Task
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {showTaskForm && (
              <Card>
                <div className="mb-4">
                  <SectionHead title="Add Task" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Milestone:{" "}
                    {milestones.find(
                      (m) => m.id === taskMilestoneId
                    )?.title ?? "Select a milestone"}
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm((current) => ({
                        ...current,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Task title"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />

                  <textarea
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm((current) => ({
                        ...current,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Task description"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-500"
                  />

                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm((current) => ({
                        ...current,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={closeTaskForm}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-border bg-background text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleCreateTask()}
                      disabled={savingTask}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingTask ? "Adding..." : "Add Task"}
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

      </Card>
    </div>
  );
}