import { useEffect, useState } from "react";
import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";
import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import SectionHead from "../../components/common/SectionHead";
import { studentService } from "../../services/StudentService";
import type { Meeting } from "../../types/Guide";

export default function StudentMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    scheduledAt: "",
    durationMinutes: 60,
    agenda: "",
  });

  const loadMeetings = async () => {
    try {
      const list = await studentService.getMyMeetings();
      setMeetings(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const parseMeetingDate = (value: string) => {
  // API returns UTC timestamps without the Z suffix.
  const normalized = /Z$/i.test(value) ? value : `${value}Z`;
  return new Date(normalized);
};

  useEffect(() => {
    loadMeetings();
  }, []);

  const now = Date.now();
  const upcoming = meetings.filter(
  (m) =>
    m.status !== "Completed" &&
    parseMeetingDate(m.scheduledAt).getTime() >= now
);
  const pendingRequests = meetings.filter((m) => m.status === "Pending" || m.status === "Requested");
  const completed = meetings.filter((m) => m.status === "Completed");

  const handleCreate = async () => {
    if (!form.title.trim() || !form.scheduledAt) return;
    setSaving(true);
    setError("");
    try {
      await studentService.createMeeting({
        title: form.title.trim(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: form.durationMinutes,
        agenda: form.agenda.trim(),
      });
      setForm({ title: "", scheduledAt: "", durationMinutes: 60, agenda: "" });
      await loadMeetings();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to request meeting");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
  try {
    setError("");


const updatedMeeting = await studentService.cancelMeeting(id);

setMeetings((prev) =>
  prev.map((m) => (m.id === id ? updatedMeeting : m))
);

  } catch (e: any) {
    console.error("Cancel meeting error:", e);

    setError(
      e?.response?.data?.message ||
      e?.response?.data?.title ||
      e?.message ||
      "Failed to cancel meeting"
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Upcoming" value={`${upcoming.length}`} icon={Calendar} color="bg-blue-500"/>
        <StatCard label="Total" value={`${meetings.length}`} icon={Activity} color="bg-indigo-500"/>
        <StatCard label="Pending Requests" value={`${pendingRequests.length}`} icon={Clock} color="bg-amber-500"/>
        <StatCard label="Completed" value={`${completed.length}`} icon={CheckCircle} color="bg-green-500"/>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHead title="Request a Meeting"/>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                placeholder="Chapter 3 Discussion"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Duration (minutes)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 60 })}
                className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Agenda</label>
              <textarea
                value={form.agenda}
                onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary resize-none"
                rows={3}
                placeholder="Brief agenda…"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !form.title.trim() || !form.scheduledAt}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl"
            >
              {saving ? "Requesting…" : "Request Meeting"}
            </button>
          </div>
        </Card>

        <Card>
          <SectionHead title="My Meetings"/>
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No meetings yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {meetings.map((m) => (
                <div key={m.id} className="border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">{m.title}</p>
                      {m.guideName && <p className="text-xs text-muted-foreground">with {m.guideName}</p>}
                    </div>
                    <Badge variant={m.status === "Completed" ? "success" : m.status === "Pending" || m.status === "Requested" ? "warning" : "info"}>
                      {m.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
  {parseMeetingDate(m.scheduledAt).toLocaleDateString("en-IN")} ·{" "}
  {parseMeetingDate(m.scheduledAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}{" "}
  · {m.durationMinutes} min
</p>

                  {m.agenda && <p className="text-xs text-muted-foreground mb-3">{m.agenda}</p>}
                  {/* <button
                    onClick={() => handleDelete(m.id)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    <Trash2 className="w-3 h-3" /> Cancel
                  </button> */}
                  <button
  onClick={() => handleDelete(m.id)}
  disabled={m.status === "Completed" || m.status === "Cancelled"}
  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
>
  <Trash2 className="w-3 h-3" /> Cancel
</button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
