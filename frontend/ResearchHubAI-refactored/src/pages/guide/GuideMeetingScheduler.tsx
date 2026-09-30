import { useEffect, useState } from "react";
import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Trash2
} from "lucide-react";
import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import SectionHead from "../../components/common/SectionHead";
import { guideService } from "../../services/GuideService";
import { Meeting } from "../../types/Guide";

const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function GuideMeetingScheduler() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Video Call");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMeetings = async () => {
  try {
    const m = await guideService.getMyMeetings();

    console.log("GUIDE MEETINGS API RESPONSE:", m);

    setMeetings(m);
  } catch (e) {
    console.error("Failed to load meetings", e);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => { fetchMeetings(); }, []);

  const handleSchedule = async () => {
    if (!title.trim() || !date || !time) return;
    setSubmitting(true);
    try {
      await guideService.createMeeting({
        title: title.trim(),
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        durationMinutes: 30,
        participantIds: [],
      });
      setTitle(""); setDate(""); setTime("");
      await fetchMeetings();
    } catch (e) {
      console.error("Failed to create meeting", e);
    } finally {
      setSubmitting(false);
    }
  };


  const handleDeleteMeeting = async (id: string) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this meeting?"
  );

  if (!confirmed) return;

  try {
    await guideService.deleteMeeting(id);

    // Remove deleted meeting from UI
    setMeetings(prev => prev.filter(m => m.id !== id));

    alert("Meeting deleted successfully.");
  } catch (e) {
    console.error("Failed to delete meeting", e);
    alert("Failed to delete meeting.");
  }
};

  const parseMeetingDate = (value: string) => {
  // API stores meeting time as UTC but may omit the Z suffix.
  const normalized = /Z$/i.test(value) ? value : `${value}Z`;
  return new Date(normalized);
};

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const meetingDates = new Set(
  meetings.map(m => parseMeetingDate(m.scheduledAt).getDate())
);

  const today = now.getDate();

  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

const thisWeekMeetings = meetings.filter(m => {
  const d = parseMeetingDate(m.scheduledAt);
  return d >= startOfWeek && d < endOfWeek;
}).length;
const thisMonthMeetings = meetings.filter(
  m => parseMeetingDate(m.scheduledAt).getMonth() === month
).length;

const upcomingMeetings = meetings.filter(
  m =>
    parseMeetingDate(m.scheduledAt) >= now &&
    (m.status || "").toLowerCase() === "scheduled"
).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Today" value={meetings.filter(
  m =>
    parseMeetingDate(m.scheduledAt).toDateString() ===
    now.toDateString()
).length.toString()} icon={Calendar} color="bg-indigo-500"/>
        <StatCard label="This Week" value={thisWeekMeetings.toString()} icon={Activity} color="bg-blue-500"/>
        <StatCard label="Upcoming" value={upcomingMeetings.toString()} icon={Clock} color="bg-amber-500"/>
        <StatCard label="Total (Month)" value={thisMonthMeetings.toString()} icon={CheckCircle} color="bg-green-500"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <SectionHead title={`${now.toLocaleString("default",{month:"long"})} ${year}`}/>
          <div className="grid grid-cols-7 gap-0.5 mb-1">{DAYS.map(d=><p key={d} className="text-center text-xs font-bold text-muted-foreground py-1">{d}</p>)}</div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array(startDay).fill(null).map((_,i)=><div key={i}/>)}
            {Array.from({length:daysInMonth},(_,i)=>i+1).map(d=>{
              const hasEv=meetingDates.has(d), isSel=d===sel, isToday=d===today;
              return <button key={d} onClick={()=>setSel(sel===d?null:d)} className={`aspect-square rounded-xl flex items-center justify-center text-xs font-medium relative transition-all ${isSel?"bg-indigo-600 text-white":isToday?"bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 font-bold":"hover:bg-muted text-foreground"}`}>
                {d}{hasEv&&!isSel&&<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full"/>}
              </button>;
            })}
          </div>
        </Card>
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card>
            <SectionHead title="Upcoming Meetings"/>
            {meetings.length===0&&<p className="text-xs text-muted-foreground text-center py-6">No upcoming meetings</p>}
            {meetings.map((m,i)=>(
              <div key={m.id} className={`flex items-center gap-4 p-3 border border-border rounded-xl hover:bg-muted/30 ${i>0?"mt-2":""}`}>
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5 text-indigo-600"/></div>
                <div className="flex-1"><p className="font-bold text-sm text-foreground">{m.title}</p><p className="text-xs text-muted-foreground">
  {parseMeetingDate(m.scheduledAt).toLocaleDateString("en-IN")} ·{" "}
  {parseMeetingDate(m.scheduledAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })} · {m.durationMinutes}min
</p></div>
                <div className="flex items-center gap-2">
                  <Badge variant={(m.status||"").toLowerCase()==="scheduled"?"info":(m.status||"").toLowerCase()==="completed"?"success":"warning"}>{m.status}</Badge>
                  {m.meetingLink && (
  <button className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700">
    Join
  </button>
)}

<button
  onClick={() => handleDeleteMeeting(m.id)}
  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
  title="Delete meeting"
>
  <Trash2 className="w-4 h-4" />
</button>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <SectionHead title="Schedule New Meeting"/>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title</label><input type="text" className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground" placeholder="e.g. Progress Check-in" value={title} onChange={e=>setTitle(e.target.value)}/></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Type</label><select className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground" value={type} onChange={e=>setType(e.target.value)}><option>Video Call</option><option>In-Person</option></select></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Date</label><input type="date" className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" value={date} onChange={e=>setDate(e.target.value)}/></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Time</label><input type="time" className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" value={time} onChange={e=>setTime(e.target.value)}/></div>
            </div>
            <button disabled={submitting||!title.trim()||!date||!time} onClick={handleSchedule} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2"><Plus className="w-4 h-4"/>{submitting?"Scheduling...":"Schedule"}</button>
          </Card>
        </div>
      </div>
    </div>
  );
}
