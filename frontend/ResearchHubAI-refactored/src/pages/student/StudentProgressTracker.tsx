import { useEffect, useState } from "react";
import {
  Award,
  CheckSquare,
  Clock,
  TrendingUp,
} from "lucide-react";
import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import ProgressBar from "../../components/common/ProgressBar";
import SectionHead from "../../components/common/SectionHead";
import { studentService } from "../../services/StudentService";
import type { DashboardData } from "../../types/Student";
import type { Chapter } from "../../types/Guide";

export default function StudentProgressTracker() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const dash = await studentService.getDashboard();
        setData(dash);
        if (dash.currentProject) {
          const chs = await studentService.getProjectChapters(dash.currentProject.id);
          setChapters(chs);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load progress");
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

  const completion = data?.completionPercentage || 0;
  const totalTasks = (data?.pendingTasks || 0) + (data?.completedTasks || 0);
  const milestoneCount = data?.upcomingMilestones?.length || 0;

  const approvedChapters = chapters.filter((c) => c.status === "Approved").length;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Overall Progress" value={`${completion}%`} icon={TrendingUp} color="bg-blue-500"/>
        <StatCard label="Tasks Completed" value={`${data?.completedTasks || 0}/${totalTasks}`} icon={CheckSquare} color="bg-green-500"/>
        <StatCard label="Pending Tasks" value={`${data?.pendingTasks || 0}`} icon={Clock} color="bg-amber-500"/>
        <StatCard label="Chapter Approvals" value={`${approvedChapters}/${chapters.length || 0}`} icon={Award} color="bg-indigo-500"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHead title="Upcoming Milestones"/>
          {milestoneCount === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No milestones yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data?.upcomingMilestones.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${m.isCompleted ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"}`}>
                    {m.isCompleted ? "✓" : m.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.targetDate).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={m.isCompleted ? "success" : "outline"}>{m.isCompleted ? "Done" : "Pending"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <SectionHead title="Chapter Completion"/>
          {chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No chapters yet</p>
          ) : (
            chapters.slice().sort((a, b) => a.order - b.order).map((c) => (
              <div key={c.id} className={chapters[0]?.id === c.id ? "" : "mt-3"}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">{c.title || `Chapter ${c.order}`}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "Approved" ? "success" : c.status === "InReview" || c.status === "UnderReview" || c.status === "Review" ? "warning" : "default"}>{c.status}</Badge>
                  </div>
                </div>
                <ProgressBar value={c.status === "Approved" ? 100 : c.status === "InReview" || c.status === "UnderReview" || c.status === "Review" ? 70 : 30} color={c.status === "Approved" ? "bg-green-500" : c.status === "InReview" || c.status === "UnderReview" || c.status === "Review" ? "bg-blue-500" : "bg-amber-500"}/>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* <Card>
        <SectionHead title="Coursework Summary"/>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{data?.courseworkStatus || "Not started"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Research Stage</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{data?.researchStageName || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Credits Earned</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{data?.earnedCredits ?? 0} / {data?.requiredCredits ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Papers</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{data?.passedPapers ?? 0} passed · {data?.pendingPapers ?? 0} pending</p>
          </div>
        </div>
      </Card> */}

      <Card>
  <SectionHead title="Coursework Summary" />

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div>
      <p className="text-xs text-muted-foreground">Status</p>
      <p className="text-sm font-bold text-foreground mt-0.5">
        {data?.courseworkStatus || "Not started"}
      </p>
    </div>

    <div>
      <p className="text-xs text-muted-foreground">Credits Earned</p>
      <p className="text-sm font-bold text-foreground mt-0.5">
        {data?.earnedCredits ?? 0} / {data?.requiredCredits ?? 0}
      </p>
    </div>

    <div>
      <p className="text-xs text-muted-foreground">Papers</p>
      <p className="text-sm font-bold text-foreground mt-0.5">
        {data?.passedPapers ?? 0} passed · {data?.pendingPapers ?? 0} pending
      </p>
    </div>
  </div>
</Card>
    </div>
  );
}