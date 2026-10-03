// import { useEffect, useState } from "react";
// import { AlertCircle, Bell, CheckCircle, MessageCircle } from "lucide-react";
// import StatCard from "../../components/cards/StatCard";
// import Avatar from "../../components/common/Avatar";
// import Badge from "../../components/common/Badge";
// import Card from "../../components/common/Card";
// import SectionHead from "../../components/common/SectionHead";
// import { studentService } from "../../services/StudentService";
// import type { Project } from "../../types/Student";
// import type { Chapter, ChapterComment } from "../../types/Guide";

// export default function StudentGuideComments() {
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [projectId, setProjectId] = useState<string>("");
//   const [chapters, setChapters] = useState<Chapter[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [replyTo, setReplyTo] = useState<{ chapterId: string; commentId: string } | null>(null);
//   const [replyText, setReplyText] = useState("");

//   useEffect(() => {
//     studentService.getMyProjects()
//       .then((paged) => {
//         const items = paged.items;
//         setProjects(items);
//         if (items.length > 0) setProjectId(items[0].id);
//         else setLoading(false);
//       })
//       .catch((e: unknown) => { setError(e instanceof Error ? e.message : "Failed to load projects"); setLoading(false); });
//   }, []);

//   const loadChapters = async (pid: string) => {
//     try {
//       const chs = await studentService.getProjectChapters(pid);
//       setChapters(chs);
//     } catch (e: unknown) {
//       setError(e instanceof Error ? e.message : "Failed to load comments");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!projectId) return;
//     setLoading(true);
//     setError("");
//     loadChapters(projectId);
//   }, [projectId]);

//   const comments: { chapter: Chapter; comment: ChapterComment }[] = chapters.flatMap((c) =>
//     (c.comments || []).map((comment) => ({ chapter: c, comment }))
//   );

//   const totalComments = comments.length;
//   const unread = 0;
//   const resolved = comments.filter(({ comment }) => comment.content.toLowerCase().includes("approved")).length;
//   const actionRequired = comments.filter(({ comment }) => !comment.content.toLowerCase().includes("approved")).length;

//   const handleReply = async (chapterId: string, commentId: string) => {
//     if (!replyText.trim()) return;
//     try {
//       await studentService.addChapterComment(chapterId, { content: replyText.trim() });
//       setReplyText("");
//       setReplyTo(null);
//       await loadChapters(projectId);
//     } catch (e: unknown) {
//       setError(e instanceof Error ? e.message : "Failed to send reply");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (projects.length === 0) {
//     return (
//       <Card>
//         <div className="text-center py-12 text-muted-foreground">
//           <p className="text-sm">No research projects yet.</p>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <div className="flex flex-col gap-6">
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//         <StatCard label="Total Comments" value={`${totalComments}`} icon={MessageCircle} color="bg-blue-500"/>
//         <StatCard label="Resolved" value={`${resolved}`} icon={CheckCircle} color="bg-green-500"/>
//         <StatCard label="Action Required" value={`${actionRequired}`} icon={AlertCircle} color="bg-red-500"/>
//         <StatCard label="Unread" value={`${unread}`} icon={Bell} color="bg-amber-500"/>
//       </div>

//       {error && (
//         <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">
//           {error}
//         </div>
//       )}

//       {projects.length > 1 && (
//         <Card p={false}>
//           <div className="flex items-center gap-3 px-5 py-4">
//             <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Project</label>
//             <select
//               value={projectId}
//               onChange={(e) => setProjectId(e.target.value)}
//               className="flex-1 bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
//             >
//               {projects.map((p) => (
//                 <option key={p.id} value={p.id}>{p.title}</option>
//               ))}
//             </select>
//           </div>
//         </Card>
//       )}

//       <Card>
//         <SectionHead title="Guide Feedback" desc="Comments and feedback from your guide" />
//         {comments.length === 0 ? (
//           <p className="text-sm text-muted-foreground text-center py-6">No comments yet</p>
//         ) : (
//           comments.map(({ chapter, comment }) => (
//             <div key={comment.id} className={`border-2 rounded-xl p-4 border-border ${comments[0] && comments[0].comment.id === comment.id ? "" : "mt-3"}`}>
//               <div className="flex items-start justify-between gap-3 mb-3">
//                 <div className="flex items-center gap-3">
//                   <Avatar name={comment.userName || "Guide"}/>
//                   <div>
//                     <p className="font-bold text-sm text-foreground">{comment.userName || "Guide"}</p>
//                     <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
//                   </div>
//                 </div>
//                 <Badge variant="outline">{chapter.title || `Chapter ${chapter.order}`}</Badge>
//               </div>
//               <p className="text-sm text-muted-foreground leading-relaxed mb-3">{comment.content}</p>
//               {replyTo?.commentId === comment.id ? (
//                 <div className="flex gap-2">
//                   <input
//                     value={replyText}
//                     onChange={(e) => setReplyText(e.target.value)}
//                     onKeyDown={(e) => { if (e.key === "Enter") handleReply(chapter.id, comment.id); }}
//                     className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
//                     placeholder="Type reply..."
//                     autoFocus
//                   />
//                   <button onClick={() => handleReply(chapter.id, comment.id)} className="bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl">Send</button>
//                   <button onClick={() => setReplyTo(null)} className="border border-border text-xs text-muted-foreground px-3 py-2 rounded-xl hover:bg-muted">Cancel</button>
//                 </div>
//               ) : (
//                 <button onClick={() => { setReplyTo({ chapterId: chapter.id, commentId: comment.id }); setReplyText(""); }} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
//                   <MessageCircle className="w-3.5 h-3.5"/>Reply
//                 </button>
//               )}
//             </div>
//           ))
//         )}
//       </Card>
//     </div>
//   );
// }

import {
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle,
  ChevronRight,
  MessageCircle,
  Send,
} from "lucide-react";

import StatCard from "../../components/cards/StatCard";
import Avatar from "../../components/common/Avatar";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";

import { studentService } from "../../services/StudentService";
import type {
  Project,
  StudentProfileDto,
} from "../../types/Student";
import type {
  Chapter,
  ChapterComment,
} from "../../types/Guide";

type ReplyTarget = {
  commentId: string;
  userName: string;
};

export default function StudentGuideComments() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");

  const [profile, setProfile] =
    useState<StudentProfileDto | null>(null);

  const [chapters, setChapters] =
    useState<Chapter[]>([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Selected chapter for conversation view
  const [selectedChapterId, setSelectedChapterId] =
    useState<string | null>(null);

  // Reply target
  const [replyTo, setReplyTo] =
    useState<ReplyTarget | null>(null);

  const [replyText, setReplyText] =
    useState("");

  // ---------------------------------------
  // Load projects
  // ---------------------------------------
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const paged =
          await studentService.getMyProjects();

        const items = paged.items || [];

        setProjects(items);

        if (items.length > 0) {
          setProjectId(items[0].id);
        } else {
          setLoading(false);
        }
      } catch (e: unknown) {
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load projects"
        );

        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // ---------------------------------------
  // Load profile
  // ---------------------------------------
  useEffect(() => {
    studentService
      .getProfile()
      .then((data) => {
        setProfile(data);
      })
      .catch((e: unknown) => {
        console.error(
          "Failed to load student profile:",
          e
        );
      });
  }, []);

  // ---------------------------------------
  // Load chapters + comments
  // ---------------------------------------
  const loadChapters = async (pid: string) => {
    if (!pid) return;

    try {
      setError("");

      const result =
        await studentService.getProjectChapters(pid);

      setChapters(result || []);
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to load guide comments"
      );

      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------
  // Project change
  // ---------------------------------------
  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    setSelectedChapterId(null);
    setReplyTo(null);
    setReplyText("");

    loadChapters(projectId);
  }, [projectId]);

  // ---------------------------------------
  // All comments
  // ---------------------------------------
  const allComments = chapters.flatMap(
    (chapter) => {
      if (
        !chapter.comments ||
        !Array.isArray(chapter.comments)
      ) {
        return [];
      }

      return chapter.comments;
    }
  );

  // ---------------------------------------
  // Chapters which have comments
  // ---------------------------------------
  const chaptersWithComments = chapters
    .filter(
      (chapter) =>
        Array.isArray(chapter.comments) &&
        chapter.comments.length > 0
    )
    .map((chapter) => {
      const comments = [
        ...(chapter.comments || []),
      ].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );

      return {
        chapter,
        comments,
        latest: comments[comments.length - 1],
      };
    });

  // ---------------------------------------
  // Selected chapter
  // ---------------------------------------
  const selectedChapter =
    chapters.find(
      (chapter) =>
        chapter.id === selectedChapterId
    ) || null;

  // ---------------------------------------
  // Conversation comments
  // ---------------------------------------
  const conversationComments: ChapterComment[] =
    selectedChapter?.comments
      ? [...selectedChapter.comments].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        )
      : [];

 

// ---------------------------------------
// Stats
// ---------------------------------------
const guideFeedbackThreads = Array.from(
  new Set(
    allComments
      .filter(
        (comment) =>
          !comment.parentCommentId &&
          profile?.guideId === comment.userId &&
          comment.feedbackThreadId
      )
      .map((comment) => comment.feedbackThreadId)
  )
);

const totalComments = guideFeedbackThreads.length;

const resolved = guideFeedbackThreads.filter((threadId) => {
  const threadComments = allComments.filter(
    (comment) =>
      comment.feedbackThreadId === threadId
  );

  return (
    threadComments.length > 0 &&
    threadComments.every(
      (comment) => comment.isResolved
    )
  );
}).length;
const actionRequired =
  totalComments - resolved;

const unread = guideFeedbackThreads.filter((threadId) => {
  const threadComments = allComments.filter(
    (comment) =>
      comment.feedbackThreadId === threadId
  );

  return threadComments.some(
    (comment) =>
      profile?.guideId === comment.userId &&
      !comment.isRead
  );
}).length;
  // ---------------------------------------
// Open chapter conversation
// ---------------------------------------
const openChapter = async (chapterId: string) => {
  setSelectedChapterId(chapterId);
  setReplyTo(null);
  setReplyText("");
  setError("");

  const chapter = chapters.find(
    (item) => item.id === chapterId
  );

  if (!chapter?.comments?.length) {
    return;
  }

  // Find feedback threads that still contain
  // unread Guide feedback.
  const unreadThreadIds = Array.from(
    new Set(
      chapter.comments
        .filter(
          (comment) =>
            comment.feedbackThreadId &&
            !comment.isRead
        )
        .map(
          (comment) =>
            comment.feedbackThreadId as string
        )
    )
  );

  if (unreadThreadIds.length === 0) {
    return;
  }

  try {
    // Mark each unread feedback thread as read.
    await Promise.all(
      unreadThreadIds.map((threadId) =>
        studentService.markChapterFeedbackThreadAsRead(
          chapterId,
          threadId
        )
      )
    );

    // Update local state immediately.
    setChapters((currentChapters) =>
      currentChapters.map((currentChapter) => {
        if (currentChapter.id !== chapterId) {
          return currentChapter;
        }

        return {
          ...currentChapter,

          comments:
            currentChapter.comments?.map(
              (comment) =>
                comment.feedbackThreadId &&
                unreadThreadIds.includes(
                  comment.feedbackThreadId
                )
                  ? {
                      ...comment,
                      isRead: true,
                    }
                  : comment
            ),
        };
      })
    );
  } catch (e: unknown) {
    console.error(
      "Failed to mark guide feedback as read:",
      e
    );
  }
};

  // ---------------------------------------
  // Back to chapter list
  // ---------------------------------------
  const closeConversation = () => {
    setSelectedChapterId(null);
    setReplyTo(null);
    setReplyText("");
    setError("");
  };

  // ---------------------------------------
  // Send message / reply
  // ---------------------------------------
 const handleSendMessage = async () => {
  const content = replyText.trim();

  if (!content || !selectedChapterId) {
    return;
  }

  try {
    setSending(true);
    setError("");

    const selectedChapter = chapters.find(
      (chapter) => chapter.id === selectedChapterId
    );

    if (!selectedChapter) {
      throw new Error("Chapter not found");
    }

    // If user explicitly clicked Reply, use that comment.
    // Otherwise, automatically reply to the latest guide feedback.
    let parentCommentId = replyTo?.commentId;

    if (!parentCommentId) {
      const guideComments = (selectedChapter.comments || [])
        .filter(
          (comment) =>
            !comment.parentCommentId &&
            profile?.guideId === comment.userId
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

      parentCommentId = guideComments[0]?.id;
    }

    if (!parentCommentId) {
      throw new Error(
        "No guide feedback found to reply to"
      );
    }

    await studentService.addChapterComment(
      selectedChapterId,
      {
        content,
        parentCommentId,
      }
    );

    setReplyText("");
    setReplyTo(null);

    await loadChapters(projectId);
  } catch (e: unknown) {
    setError(
      e instanceof Error
        ? e.message
        : "Failed to send message"
    );
  } finally {
    setSending(false);
  }
};

  // ---------------------------------------
  // Loading
  // ---------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ---------------------------------------
  // No projects
  // ---------------------------------------
  if (projects.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />

          <p className="text-sm font-medium">
            No research projects yet.
          </p>

          <p className="text-xs mt-1">
            Create a project to receive guide
            feedback.
          </p>
        </div>
      </Card>
    );
  }

  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <div className="flex flex-col gap-6">

      {/* =====================================
          STATISTICS
      ====================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        <StatCard
          label="Total Comments"
          value={`${totalComments}`}
          icon={MessageCircle}
          color="bg-blue-500"
        />

        <StatCard
          label="Resolved"
          value={`${resolved}`}
          icon={CheckCircle}
          color="bg-green-500"
        />

        <StatCard
          label="Action Required"
          value={`${actionRequired}`}
          icon={AlertCircle}
          color="bg-red-500"
        />

        <StatCard
          label="Unread"
          value={`${unread}`}
          icon={Bell}
          color="bg-amber-500"
        />

      </div>

      {/* =====================================
          ERROR
      ====================================== */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* =====================================
          PROJECT SELECTOR
      ====================================== */}
      {projects.length > 1 && (
        <Card p={false}>
          <div className="flex items-center gap-3 px-5 py-4">

            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
              Project
            </label>

            <select
              value={projectId}
              onChange={(e) =>
                setProjectId(e.target.value)
              }
              className="flex-1 bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.title}
                </option>
              ))}
            </select>

          </div>
        </Card>
      )}

      {/* =====================================
          GUIDE FEEDBACK
      ====================================== */}
      <Card p={false}>

        {/* ===================================
            CONVERSATION VIEW
        ==================================== */}
        {selectedChapter ? (
          <div className="flex flex-col">

            {/* Conversation Header */}
            <div className="px-5 py-4 border-b border-border">

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={closeConversation}
                  className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  title="Back to chapters"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>

                <div className="min-w-0">

                  <h2 className="text-base font-semibold text-foreground truncate">
                    {selectedChapter.title ||
                      `Chapter ${selectedChapter.order}`}
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    {conversationComments.length}{" "}
                    {conversationComments.length === 1
                      ? "message"
                      : "messages"}
                  </p>

                </div>

              </div>

            </div>

            {/* Conversation Messages */}
            <div className="px-4 sm:px-6 py-6 bg-muted/10">

              <div className="max-w-4xl mx-auto space-y-5">

                {conversationComments.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />

                    <p className="text-sm text-muted-foreground">
                      No messages yet.
                    </p>
                  </div>
                ) : (
                  conversationComments.map(
                    (comment) => {

                      const isGuide =
                        profile?.guideId ===
                        comment.userId;

                      const displayName =
                        comment.userName?.trim() ||
                        (isGuide
                          ? "Guide"
                          : "You");

                      return (
                        <div
                          key={comment.id}
                          className={`flex items-end gap-2 ${
                            isGuide
                              ? "justify-start"
                              : "justify-end"
                          }`}
                        >

                          {/* Guide Avatar */}
                          {isGuide && (
                            <Avatar
                              name={displayName}
                            />
                          )}

                          <div
                            className={`max-w-[80%] flex flex-col ${
                              isGuide
                                ? "items-start"
                                : "items-end"
                            }`}
                          >

                            {/* Name + Badge */}
                            <div
                              className={`flex items-center gap-2 mb-1 px-1 ${
                                !isGuide
                                  ? "flex-row-reverse"
                                  : ""
                              }`}
                            >

                              <span className="text-xs font-semibold text-foreground">
                                {displayName}
                              </span>

                              <Badge
                                variant={
                                  isGuide
                                    ? "info"
                                    : "default"
                                }
                              >
                                {isGuide
                                  ? "GUIDE"
                                  : "YOU"}
                              </Badge>

                            </div>

                            {/* Message Bubble */}
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm ${
                                isGuide
                                  ? "bg-background border border-border rounded-bl-md"
                                  : "bg-blue-600 text-white rounded-br-md"
                              }`}
                            >

                              <p
                                className={`text-sm leading-6 whitespace-pre-wrap ${
                                  isGuide
                                    ? "text-foreground"
                                    : "text-white"
                                }`}
                              >
                                {comment.content}
                              </p>

                            </div>

                            {/* Time + Reply */}
                            <div
                              className={`flex items-center gap-2 mt-1 px-1 ${
                                !isGuide
                                  ? "flex-row-reverse"
                                  : ""
                              }`}
                            >

                              <span className="text-[10px] text-muted-foreground">
                                {new Date(
                                  comment.createdAt
                                ).toLocaleString(
                                  [],
                                  {
                                    hour: "numeric",
                                    minute:
                                      "2-digit",
                                    day: "2-digit",
                                    month:
                                      "short",
                                  }
                                )}
                              </span>

                             {isGuide && (
  <button
    type="button"
    onClick={() => {
      setReplyTo({
        commentId: comment.id,
        userName: displayName,
      });

      setReplyText("");
    }}
    className="text-[10px] font-medium text-muted-foreground hover:text-blue-600 transition-colors"
  >
    Reply
  </button>
)}

                            </div>

                          </div>

                          {/* Student Avatar */}
                          {!isGuide && (
                            <Avatar
                              name={displayName}
                            />
                          )}

                        </div>
                      );
                    }
                  )
                )}

              </div>

            </div>

            {/* =================================
                BOTTOM COMPOSER
            ================================== */}
            <div className="border-t border-border bg-background px-4 sm:px-6 py-4">

              <div className="max-w-4xl mx-auto">

                {/* Reply Context */}
                {replyTo && (
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 border border-border px-3 py-2">

                    <div className="text-xs text-muted-foreground">
                      Replying to{" "}
                      <span className="font-semibold text-foreground">
                        {replyTo.userName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyText("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>

                  </div>
                )}

                <div className="flex items-end gap-2">

                  <textarea
                    value={replyText}
                    onChange={(e) =>
                      setReplyText(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey
                      ) {
                        e.preventDefault();

                        if (
                          replyText.trim() &&
                          !sending
                        ) {
                          handleSendMessage();
                        }
                      }
                    }}
                    rows={1}
                    disabled={sending}
                    placeholder={
                      replyTo
                        ? `Reply to ${replyTo.userName}...`
                        : "Write a message..."
                    }
                    className="flex-1 resize-none bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-blue-500 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={
                      !replyText.trim() ||
                      sending
                    }
                    className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    title="Send"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>

                </div>

                <p className="text-[10px] text-muted-foreground mt-2">
                  Press Enter to send • Shift + Enter
                  for a new line
                </p>

              </div>

            </div>

          </div>
        ) : (

          /* ===================================
             CHAPTER LIST VIEW
          ==================================== */
          <div>

            {/* Header */}
            <div className="px-5 py-4 border-b border-border">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>

                <div>

                  <h2 className="text-base font-semibold text-foreground">
                    Guide Feedback
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Chapters with guide comments
                  </p>

                </div>

              </div>

            </div>

            {/* Chapter List */}
            {chaptersWithComments.length === 0 ? (
              <div className="text-center py-12 px-5">

                <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />

                <p className="text-sm font-medium text-muted-foreground">
                  No guide comments yet
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Your guide's feedback will appear
                  here when available.
                </p>

              </div>
            ) : (
              <div className="divide-y divide-border">

                {chaptersWithComments.map(
                  ({
                    chapter,
                    comments,
                    latest,
                  }) => {

                    const latestIsGuide =
                      profile?.guideId ===
                      latest?.userId;

                    const latestName =
                      latest?.userName?.trim() ||
                      (latestIsGuide
                        ? "Guide"
                        : "You");

                    return (
                      <button
                        key={chapter.id}
                        type="button"
                        onClick={() =>
                          openChapter(
                            chapter.id
                          )
                        }
                        className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors"
                      >

                        <div className="flex items-center gap-4">

                          {/* Chapter Icon */}
                          <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">

                            <div className="flex items-center gap-2">

                              <h3 className="text-sm font-semibold text-foreground truncate">
                                {chapter.title ||
                                  `Chapter ${chapter.order}`}
                              </h3>

                             <Badge variant="default">
  {comments.length}{" "}
  {comments.length === 1
    ? "message"
    : "messages"}
</Badge>

                            </div>

                            <div className="flex items-center gap-2 mt-1">

                              <span className="text-xs font-medium text-muted-foreground">
                                {latestName}
                              </span>

                              <span className="text-xs text-muted-foreground">
                                •
                              </span>

                              <span className="text-xs text-muted-foreground truncate">
                                {latest?.content ||
                                  "No content"}
                              </span>

                            </div>

                            {latest?.createdAt && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(
                                  latest.createdAt
                                ).toLocaleString(
                                  [],
                                  {
                                    day: "2-digit",
                                    month:
                                      "short",
                                    year:
                                      "numeric",
                                    hour:
                                      "numeric",
                                    minute:
                                      "2-digit",
                                  }
                                )}
                              </p>
                            )}

                          </div>

                          {/* Arrow */}
                          <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" />

                        </div>

                      </button>
                    );
                  }
                )}

              </div>
            )}

          </div>
        )}

      </Card>

    </div>
  );
}