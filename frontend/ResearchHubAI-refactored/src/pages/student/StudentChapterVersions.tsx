import { useEffect, useState } from "react";
import { Download, Eye, Plus } from "lucide-react";

import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import SectionHead from "../../components/common/SectionHead";
import { studentService } from "../../services/StudentService";

import type { Project, ProjectDocument } from "../../types/Student";
import type { Chapter, ChapterVersion } from "../../types/Guide";


import { Button } from "@/components/ui/button";

const statusVariant = (
  status: string
): "success" | "warning" | "default" | "outline" => {
  if (status === "Approved") return "success";

  if (
    status === "InReview" ||
    status === "UnderReview" ||
    status === "Review"
  ) {
    return "warning";
  }

 if (status === "Draft" || status === "Submitted") {
  return "warning";
}

  return "outline";
};

const getFileType = (fileName: string, fileType?: string) => {
  const extension =
    fileType?.toLowerCase() ||
    fileName.split(".").pop()?.toLowerCase() ||
    "";

  return extension.replace(".", "");
};

const getFileBadgeClass = (fileType: string) => {
  if (fileType === "pdf") {
    return "bg-red-50 dark:bg-red-900/20 text-red-600";
  }

  if (fileType === "docx" || fileType === "doc") {
    return "bg-blue-50 dark:bg-blue-900/20 text-blue-600";
  }

  if (fileType === "txt") {
    return "bg-gray-100 dark:bg-gray-800 text-gray-600";
  }

  return "bg-muted text-muted-foreground";
};

export default function StudentChapterVersions() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");

  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);

  const [chapterVersions, setChapterVersions] = useState<
  Record<string, ChapterVersion[]>
>({});

  const [showChapterForm, setShowChapterForm] = useState(false);

  const [versionChapterId, setVersionChapterId] = useState<string | null>(null);

 const [versionFile, setVersionFile] = useState<File | null>(null);

  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");

  const [chapterFile, setChapterFile] = useState<File | null>(null);
  const [chapterOrder, setChapterOrder] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ---------------------------------------------------------
  // Load student's projects
  // ---------------------------------------------------------
  useEffect(() => {
    studentService
      .getMyProjects()
      .then((paged) => {
        const items = paged.items;

        setProjects(items);

        if (items.length > 0) {
          setProjectId(items[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        setError(
          e instanceof Error ? e.message : "Failed to load projects"
        );
        setLoading(false);
      });
  }, []);

  // ---------------------------------------------------------
  // Load chapters + documents whenever project changes
  // ---------------------------------------------------------
  useEffect(() => {
  if (!projectId) return;

  setLoading(true);
  setError("");
  setMessage("");

  const loadProjectData = async () => {
    try {
      const [chs, docs] = await Promise.all([
        studentService.getProjectChapters(projectId),
        studentService.getDocuments(projectId),
      ]);

      const versionsEntries = await Promise.all(
        chs.map(async (chapter) => {
          const versions = await studentService.getChapterVersions(
            projectId,
            chapter.id
          );

          return [chapter.id, versions] as const;
        })
      );

      setChapters(chs);
      setDocuments(docs);
      setChapterVersions(
        Object.fromEntries(versionsEntries)
      );
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to load chapters"
      );
    } finally {
      setLoading(false);
    }
  };

  loadProjectData();
}, [projectId]);

  // ---------------------------------------------------------
  // Create chapter
  // ---------------------------------------------------------
  const handleCreateChapter = async () => {
    if (!projectId) {
      setError("No project selected");
      return;
    }

    if (!chapterTitle.trim()) {
      setError("Chapter title is required");
      return;
    }

    if (chapterOrder < 1) {
      setError("Chapter order must be at least 1");
      return;
    }

    if (!chapterFile) {
  setError("Please select a chapter file");
  return;
}

    try {
      setError("");
      setMessage("");

      const createdChapter = await studentService.createChapter(
  projectId,
  chapterTitle.trim(),
  chapterOrder,
  chapterFile
);
      setChapters((prev) => [...prev, createdChapter]);

      setChapterTitle("");
      setChapterContent("");

      // Set next available order
      setChapterOrder(
        Math.max(
          1,
          ...chapters.map((chapter) => chapter.order)
        ) + 1
      );

      setShowChapterForm(false);

      setMessage("Chapter created successfully");
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to create chapter"
      );
    }
  };


  const handleCreateVersion = async (chapterId: string) => {
  if (!projectId) {
    setError("No project selected");
    return;
  }

  if (!versionFile) {
    setError("Please select a chapter file");
    return;
  }

  try {
    setError("");
    setMessage("");

    const createdVersion =
      await studentService.createChapterVersion(
        projectId,
        chapterId,
        versionFile
      );

    setChapterVersions((prev) => ({
      ...prev,
      [chapterId]: [
        ...(prev[chapterId] || []),
        createdVersion,
      ],
    }));

    setVersionFile(null);
    setVersionChapterId(null);

    setMessage("New chapter version uploaded successfully");
  } catch (e: unknown) {
    setError(
      e instanceof Error
        ? e.message
        : "Failed to upload chapter version"
    );
  }
};

  // ---------------------------------------------------------
  // Download document
  // ---------------------------------------------------------
  const handleDownload = async (doc: ProjectDocument) => {
    try {
      setError("");

      const result = await studentService.downloadDocument(
        projectId,
        doc.id
      );

      const url = URL.createObjectURL(result.data);

      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName || doc.fileName;

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Download failed"
      );
    }
  };

  // ---------------------------------------------------------
  // Preview document
  // ---------------------------------------------------------
  const handlePreview = async (doc: ProjectDocument) => {
    try {
      setError("");

      const fileType = (
        doc.fileType ||
        doc.fileName.split(".").pop() ||
        ""
      ).toLowerCase();

      // PDF → open in browser
      if (fileType === "pdf") {
        const result = await studentService.previewDocument(
          projectId,
          doc.id
        );

        const url = URL.createObjectURL(result.data);

        const previewWindow = window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );

        if (!previewWindow) {
          const a = document.createElement("a");

          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";

          document.body.appendChild(a);
          a.click();
          a.remove();
        }

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 60000);

        return;
      }

      // DOC / DOCX → download
      if (fileType === "doc" || fileType === "docx") {
        await handleDownload(doc);
        return;
      }

      // Other files → download
      await handleDownload(doc);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Preview failed"
      );
    }
  };

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ---------------------------------------------------------
  // No projects
  // ---------------------------------------------------------
  if (projects.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">
            No research projects yet.
          </p>
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="flex flex-col gap-5">

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Success message */}
      {message && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-300">
          {message}
        </div>
      )}

      {/* Project selector */}
      {projects.length > 1 && (
        <Card p={false}>
          <div className="flex items-center gap-3 px-5 py-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
              Project
            </label>

            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex-1 bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* =====================================================
          Chapters
      ====================================================== */}
      <Card>
        <SectionHead
          title="Chapters"
          desc="Thesis chapters and their latest document uploads"
          action={
            <Badge variant="default">
              {chapters.length} chapters
            </Badge>
          }
        />

        {/* Add Chapter button */}
        <Button
          onClick={() => {
            setError("");
            setMessage("");

            // Automatically suggest next order
            const nextOrder =
              chapters.length > 0
                ? Math.max(
                    ...chapters.map((chapter) => chapter.order)
                  ) + 1
                : 1;

            setChapterOrder(nextOrder);
            setShowChapterForm(true);
          }}
        >
          <Plus size={16} />
          Add Chapter
        </Button>

        {/* =================================================
            Create Chapter Form
        ================================================== */}
        {showChapterForm && (
          <div className="mt-4 p-4 border border-border rounded-xl space-y-4">

            {/* Title */}
            <div>
              <label className="text-xs font-bold text-foreground">
                Chapter Title
              </label>

              <input
                type="text"
                value={chapterTitle}
                onChange={(e) =>
                  setChapterTitle(e.target.value)
                }
                placeholder="e.g. Introduction"
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
              />
            </div>

 {/* Chapter File */}
<div>
  <label className="text-xs font-bold text-foreground">
    Chapter File
  </label>

  <input
    type="file"
    accept=".pdf,.doc,.docx"
    onChange={(e) => {
      setChapterFile(e.target.files?.[0] || null);
    }}
    className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
  />

  {chapterFile && (
    <p className="mt-2 text-xs text-muted-foreground">
      Selected: {chapterFile.name}
    </p>
  )}
</div>
            {/* Order */}
            <div>
              <label className="text-xs font-bold text-foreground">
                Chapter Order
              </label>

              <input
                type="number"
                min={1}
                value={chapterOrder}
                onChange={(e) =>
                  setChapterOrder(
                    Number(e.target.value)
                  )
                }
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowChapterForm(false);
                  setError("");
                }}
              >
                Cancel
              </Button>

              <Button
                onClick={handleCreateChapter}
              >
                Create Chapter
              </Button>
            </div>
          </div>
        )}

        {/* =================================================
            Chapter List
        ================================================== */}
        {chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No chapters yet
          </p>
        ) : (
          chapters
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((c, index) => (
              <div
                key={c.id}
                className={`border border-border rounded-xl overflow-hidden ${
                  index === 0 ? "" : "mt-3"
                }`}
              >
                {/* Chapter header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/40">

                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600">
                      CH
                    </div>

                    <span className="text-sm font-bold text-foreground">
                      {c.title || `Chapter ${c.order}`}
                    </span>
                  </div>
<div className="flex items-center gap-2">
  {/* <Badge variant={statusVariant(c.status)}>
    {c.status === "Draft" ? "Pending" : c.status}
  </Badge> */}

  <Button
    size="sm"
    variant="outline"
    onClick={() => {
      setError("");
      setMessage("");
      setVersionFile(null);
      setVersionChapterId(c.id);
    }}
  >
    <Plus size={14} />
    New Version
  </Button>
</div>
                </div>

                {/* Chapter details */}
                <div className="px-4 py-2.5 flex items-center justify-between">
  <span className="text-xs text-muted-foreground">
    Created{" "}
    {new Date(
      c.createdAt
    ).toLocaleDateString()}{" "}
    ·{" "}
    {c.comments?.length || 0}{" "}
    comment(s)
  </span>

  <span className="text-xs font-medium text-blue-600">
  {chapterVersions[c.id]?.length || 0} version
  {(chapterVersions[c.id]?.length || 0) !== 1 ? "s" : ""}
</span>
</div>

{versionChapterId === c.id && (
  <div className="px-4 pb-4">
    <div className="border border-border rounded-xl p-4 space-y-3">
      <div>
  <label className="text-xs font-bold text-foreground">
    Upload Chapter Version
  </label>

  <input
    type="file"
    accept=".pdf,.doc,.docx"
    onChange={(e) => {
      setVersionFile(e.target.files?.[0] || null);
    }}
    className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
  />

  {versionFile && (
    <p className="mt-2 text-xs text-muted-foreground">
      Selected: {versionFile.name}
    </p>
  )}
</div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setVersionChapterId(null);
              setVersionFile(null);
            setError("");
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={() =>
            handleCreateVersion(c.id)
          }
        >
         Upload Version
        </Button>
      </div>
    </div>
  </div>
)}


{(chapterVersions[c.id] || []).length > 0 && (
  <div className="px-4 pb-4 space-y-2">
    {(chapterVersions[c.id] || []).map((version) => (
      <div
        key={version.id}
        className="border border-border rounded-lg p-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Version {version.versionNumber}
          </span>

          <Badge variant={statusVariant(version.status)}>
  {version.status === "Draft" || version.status === "Submitted"
    ? "Pending"
    : version.status}
</Badge>

        </div>

        {version.fileName ? (
  <div className="mt-3 space-y-1">
    <p className="text-sm font-medium text-foreground">
      📄 {version.fileName}
    </p>

    <p className="text-xs text-muted-foreground">
      Type: {version.fileType || "Unknown"}
      {version.fileSize
        ? ` • ${(version.fileSize / 1024 / 1024).toFixed(2)} MB`
        : ""}
    </p>
  </div>
) : (
  <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
    {version.content}
  </p>
)}

        <p className="mt-2 text-[11px] text-muted-foreground">
          Created{" "}
          {new Date(
            version.createdAt
          ).toLocaleDateString()}
        </p>
      </div>
    ))}
  </div>
)}
              </div>
            ))
        )}
      </Card>

      {/* =====================================================
          Documents
      ====================================================== */}
      {documents.length > 0 && (
        <Card>
          <SectionHead
            title="Document Uploads"
            desc="Latest files uploaded to this project"
          />

          <div className="flex flex-col gap-2">
            {documents.map((d) => {
              const fileType = getFileType(
                d.fileName,
                d.fileType
              );

              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* File type */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase ${getFileBadgeClass(
                      fileType
                    )}`}
                  >
                    {fileType || "FILE"}
                  </div>

                  {/* File details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {d.fileName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {fileType.toUpperCase()} ·{" "}
                      {(d.fileSize / 1024).toFixed(1)} KB ·{" "}
                      {new Date(
                        d.uploadedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">

                    {/* Preview */}
                    <button
                      onClick={() =>
                        handlePreview(d)
                      }
                      className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                      title={
                        fileType === "pdf"
                          ? "Preview PDF"
                          : "Preview / Download"
                      }
                    >
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>

                    {/* Download */}
                    <button
                      onClick={() =>
                        handleDownload(d)
                      }
                      className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}