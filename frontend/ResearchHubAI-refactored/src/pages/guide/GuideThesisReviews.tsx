import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Search,
  Send,
  X
} from "lucide-react";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import { guideService } from "../../services/GuideService";
import {
  GuideDashboardData,
  AssignedStudentSummary,
  Chapter,
  ChapterVersion
} from "../../types/Guide";

export default function GuideThesisReviews() {
  const [dashboard, setDashboard] = useState<GuideDashboardData | null>(null);

const [chapters, setChapters] = useState<Chapter[]>([]);

const [activeStudentIdx, setActiveStudentIdx] = useState(0);

const [activeChapterIdx, setActiveChapterIdx] = useState(0);

const [loading, setLoading] = useState(true);

const [comment, setComment] = useState("");

const [sending, setSending] = useState(false);

const [resolvingCommentId, setResolvingCommentId] = useState<string | null>(null);

const [error, setError] = useState("");

const [versions, setVersions] = useState<ChapterVersion[]>([]);

const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [previewFileName, setPreviewFileName] = useState("");


  const fetchDashboard = async () => {
    try {
      const d = await guideService.getDashboard();
      setDashboard(d);
      return d;
    } catch (e) {
      console.error("Failed to load dashboard", e);
      return null;
    }
  };

  const fetchChapters = async (student: AssignedStudentSummary) => {
  try {
    const projectId = student.projectId;

    if (projectId) {
      const ch = await guideService.getProjectChapters(projectId);

      setChapters(ch);
      setActiveChapterIdx(0);

      // Fetch versions for the first chapter
      if (ch.length > 0) {
        const v = await guideService.getChapterVersions(
          projectId,
          ch[0].id
        );

        setVersions(v);
      } else {
        setVersions([]);
      }
    } else {
      setChapters([]);
      setVersions([]);
    }
  } catch (e) {
    console.error("Failed to load chapters", e);
    setChapters([]);
    setVersions([]);
  }
};

  useEffect(() => {
    (async () => {
      const d = await fetchDashboard();
      if (d?.assignedStudents.length) {
        await fetchChapters(d.assignedStudents[0]);
      }
      setLoading(false);
    })();
  }, []);

  const handleStudentClick = async (idx: number, student: AssignedStudentSummary) => {
    setActiveStudentIdx(idx);
    setLoading(true);
    await fetchChapters(student);
    setLoading(false);
  };

  const handleChapterClick = async (idx: number) => {
  setActiveChapterIdx(idx);

  const chapter = chapters[idx];
  const student = students[activeStudentIdx];

  if (!chapter || !student?.projectId) {
    setVersions([]);
    return;
  }

  try {
    const v = await guideService.getChapterVersions(
      student.projectId,
      chapter.id
    );

    setVersions(v);
  } catch (e) {
    console.error("Failed to load chapter versions", e);
    setVersions([]);
  }
};

  const handleStatusUpdate = async (chapterId: string, status: string) => {
    try {
      await guideService.updateChapterStatus(activeChapter.projectId, chapterId, { status, comment: comment || undefined });
      const student = dashboard?.assignedStudents[activeStudentIdx];
      if (student) await fetchChapters(student);
    } catch (e) {
      console.error("Failed to update chapter status", e);
    }
  };

  // const handleAddComment = async (chapterId: string) => {
  //   if (!comment.trim()) return;
  //   setSending(true);
  //   try {
  //     await guideService.addChapterComment(chapterId, { content: comment.trim() });
  //     setComment("");
  //     const student = dashboard?.assignedStudents[activeStudentIdx];
  //     if (student) await fetchChapters(student);
  //   } catch (e) {
  //     console.error("Failed to add comment", e);
  //   } finally {
  //     setSending(false);
  //   }
  // };

  const handleAddComment = async (chapterId: string) => {
  if (!comment.trim()) return;

  setSending(true);
  setError("");

  try {
    const currentChapter = chapters.find(
      (chapter) => chapter.id === chapterId
    );

    if (!currentChapter) {
      throw new Error("Chapter not found");
    }

    // Find the latest unresolved feedback thread.
    const existingFeedbackThread = (currentChapter.comments || [])
      .filter(
        (c) =>
          !c.parentCommentId &&
          c.feedbackThreadId &&
          !c.isResolved
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )[0];

    await guideService.addChapterComment(chapterId, {
      content: comment.trim(),
      feedbackThreadId:
        existingFeedbackThread?.feedbackThreadId ?? null,
    });

    setComment("");

    const student =
      dashboard?.assignedStudents[activeStudentIdx];

    if (student) {
      await fetchChapters(student);
    }
  } catch (e) {
    console.error("Failed to add comment", e);

    setError(
      e instanceof Error
        ? e.message
        : "Failed to add comment"
    );
  } finally {
    setSending(false);
  }
};

  const handleResolveComment = async (
  chapterId: string,
  commentId: string
) => {
  setResolvingCommentId(commentId);

  try {
    await guideService.resolveChapterComment(
      chapterId,
      commentId
    );

    // Reload the current chapter so the updated
    // IsResolved value comes from the database.
    const student = dashboard?.assignedStudents[activeStudentIdx];

    if (student) {
      await fetchChapters(student);
    }
  } catch (e) {
    console.error("Failed to resolve comment", e);

    setError(
      e instanceof Error
        ? e.message
        : "Failed to resolve comment"
    );
  } finally {
    setResolvingCommentId(null);
  }
};

 const handlePreviewVersion = async (version: ChapterVersion) => {
  const student = students[activeStudentIdx];

  if (!student?.projectId || !activeChapter) {
    return;
  }

  try {
    setError("");

    const result = await guideService.downloadChapterVersion(
      student.projectId,
      activeChapter.id,
      version.id
    );

    const url = URL.createObjectURL(result.data);

    setPreviewUrl(url);
    setPreviewFileName(result.fileName || version.fileName || "Document");
  } catch (e: unknown) {
    setError(
      e instanceof Error
        ? e.message
        : "Failed to preview chapter version"
    );
  }
};

  const students = dashboard?.assignedStudents ?? [];
  const activeChapter = chapters[activeChapterIdx];
  const projectTitle = students[activeStudentIdx]?.projectTitle || "Project";
  const feedbackThreads = Array.from(
  new Map(
    (activeChapter?.comments || [])
      .filter((comment) => comment.feedbackThreadId)
      .map((comment) => [comment.feedbackThreadId!, comment])
  ).values()
);

  if (loading && !dashboard) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!students.length) {
    return <div className="text-center text-muted-foreground py-10">No assigned students found.</div>;
  }

  return (
    <>
  {error && (
    <div className="fixed top-20 right-5 z-50 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 shadow-lg">
      {error}
    </div>
  )}

  {previewUrl && (
  <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6">
    <div className="w-full max-w-6xl h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col">

      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div>
          <p className="text-sm font-bold text-foreground">
            Chapter Preview
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-xl">
            {previewFileName}
          </p>
        </div>

        <button
          onClick={() => {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setPreviewFileName("");
          }}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 bg-muted">
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title="Chapter Preview"
        />
      </div>

    </div>
  </div>
)}

    <div className="flex gap-5 h-[calc(100vh-9rem)]">
      <div className="w-72 flex-shrink-0 flex flex-col gap-2">
        <div className="relative mb-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/><input className="w-full bg-muted border border-border rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-primary" placeholder="Search reviews…"/></div>
        {students.map((s,i)=>(
          <button key={s.userId} onClick={()=>handleStudentClick(i,s)} className={`w-full text-left p-3.5 rounded-xl border transition-all ${activeStudentIdx===i?"border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30":"border-border hover:bg-muted"}`}>
            <div className="flex items-center justify-between mb-1.5"><span className="text-xs font-bold text-foreground">{s.fullName}</span><Badge variant={s.completionPercentage>70?"success":s.completionPercentage>40?"warning":"danger"}>{s.completionPercentage}%</Badge></div>
            <p className="text-xs text-muted-foreground truncate">{s.researchTopic}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/>{s.projectStatus||"In Progress"}</p>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {chapters.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {chapters.map((ch,i)=>(
              <button key={ch.id} onClick={() => handleChapterClick(i)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${activeChapterIdx===i?"border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300":"border-border text-muted-foreground hover:bg-muted"}`}>
                {ch.title}
              </button>
            ))}
          </div>
        )}

        {activeChapter ? (
          <Card className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="font-bold text-foreground">{activeChapter.title}</p>
                <p className="text-xs text-muted-foreground">{projectTitle}</p>
              </div>
              <div className="flex items-center gap-2">
               <Badge
  variant={
    activeChapter.status?.toLowerCase() === "approved"
      ? "success"
      : activeChapter.status?.toLowerCase() === "revisionrequired"
      ? "danger"
      : activeChapter.status?.toLowerCase() === "submitted"
      ? "warning"
      : "default"
  }
>
  {activeChapter.status?.toLowerCase() === "submitted"
    ? "Pending"
    : activeChapter.status}
</Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="bg-muted/50 rounded-xl p-4 text-sm leading-relaxed text-muted-foreground border border-border whitespace-pre-wrap">{activeChapter.content}</div>

      {versions.length > 0 && (
  <div className="mt-5">
    <p className="text-sm font-bold text-foreground mb-3">
      Chapter Versions
    </p>

    <div className="flex flex-col gap-2">
      {versions
        .slice()
        .sort((a, b) => b.versionNumber - a.versionNumber)
        .map((version) => (
          <div
            key={version.id}
            className="border border-border rounded-xl p-3 bg-background"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Version {version.versionNumber}
                </p>

                {version.fileName ? (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    📄 {version.fileName}
                    {" • "}
                    {version.fileType || "Unknown"}
                    {version.fileSize
                      ? ` • ${(version.fileSize / 1024 / 1024).toFixed(2)} MB`
                      : ""}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Text version
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant={
                    version.status?.toLowerCase() === "approved"
                      ? "success"
                      : version.status?.toLowerCase() === "revisionrequired"
                      ? "danger"
                      : "warning"
                  }
                >
                  {version.status?.toLowerCase() === "submitted"
                    ? "Pending"
                    : version.status}
                </Badge>
{version.fileName && (
  <button
    onClick={() => handlePreviewVersion(version)}
    className="w-8 h-8 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
    title="Preview"
  >
    <Eye className="w-4 h-4 text-muted-foreground" />
  </button>
)}


              </div>
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              Created{" "}
              {new Date(version.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
    </div>
  </div>
)}
            {activeChapter.comments.length > 0 && (
  <div className="mt-5 flex flex-col gap-4">
    <p className="text-xs font-bold text-muted-foreground">
      Feedback Threads ({feedbackThreads.length})
    </p>

    {feedbackThreads.map((thread) => {
      const threadComments = activeChapter.comments
        .filter(
          (comment) =>
            comment.feedbackThreadId === thread.feedbackThreadId
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        );

      const rootComment = threadComments.find(
        (comment) => !comment.parentCommentId
      );

      const isResolved = threadComments.every(
        (comment) => comment.isResolved
      );

      return (
        <div
          key={thread.feedbackThreadId}
          className="border border-border rounded-xl overflow-hidden"
        >
          {/* Thread Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
            <div>
              <p className="text-xs font-bold text-foreground">
                Feedback Thread
              </p>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                {threadComments.length}{" "}
                {threadComments.length === 1
                  ? "comment"
                  : "comments"}
              </p>
            </div>

            {isResolved ? (
              <Badge variant="success">
                Resolved
              </Badge>
            ) : (
              rootComment && (
                <button
                  onClick={() =>
                    handleResolveComment(
                      activeChapter.id,
                      rootComment.id
                    )
                  }
                  disabled={
                    resolvingCommentId === rootComment.id
                  }
                  className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />

                  {resolvingCommentId === rootComment.id
                    ? "Approving..."
                    : "Approve Feedback"}
                </button>
              )
            )}
          </div>

          {/* Thread Comments */}
          <div className="p-3 flex flex-col gap-2">
            {threadComments.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl p-3 border ${
                  c.parentCommentId
                    ? "ml-6 bg-background border-border"
                    : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">
                    {c.userName}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {new Date(
                      c.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  {c.content}
                </p>

                {c.parentCommentId && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Reply
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
)}
            </div>
            <div className="border-t border-border px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-muted-foreground">Actions</p>
                <div className="flex gap-2">
                  <button onClick={()=>handleStatusUpdate(activeChapter.id,"Approved")} className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/>Approve</button>
                  <button onClick={()=>handleStatusUpdate(activeChapter.id,"RevisionRequired")} className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-600 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5"/>Revise</button>
                  <button onClick={()=>handleStatusUpdate(activeChapter.id,"Draft")} className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 flex items-center gap-1.5"><X className="w-3.5 h-3.5"/>Reset to Draft</button>
                </div>
              </div>
              <div className="flex gap-2">
                <textarea className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none" rows={2} placeholder="Add review comments..." value={comment} onChange={e=>setComment(e.target.value)}/>
                <button disabled={sending||!comment.trim()} onClick={()=>handleAddComment(activeChapter.id)} className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center self-stretch"><Send className="w-4 h-4"/></button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
            <p>No chapters available for this project. Ensure the project has chapters with content.</p>
          </div>
        )}
      </div>
      
    </div>

     </>
  );
}
