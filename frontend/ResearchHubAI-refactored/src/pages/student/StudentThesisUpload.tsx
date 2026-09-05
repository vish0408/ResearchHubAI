import { useEffect, useRef, useState } from "react";
import {
  Download,
  Eye,
  Trash2,
  Upload,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import { studentService } from "../../services/StudentService";
import type { Project, ProjectDocument } from "../../types/Student";

export default function StudentThesisUpload() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    studentService.getMyProjects()
      .then((paged) => {
        const items = paged.items;
        setProjects(items);
        if (items.length > 0) setProjectId(items[0].id);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load projects"));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoadingDocs(true);
    setError("");
    studentService.getDocuments(projectId)
      .then(setDocuments)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load documents"))
      .finally(() => setLoadingDocs(false));
  }, [projectId]);

  const handleUpload = async (file: File) => {
    if (!projectId || !file) return;
    setUploading(true);
    setError("");
    try {
      await studentService.uploadDocument(projectId, file);
      const docs = await studentService.getDocuments(projectId);
      setDocuments(docs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDownload = async (doc: ProjectDocument) => {
    try {
      const result = await studentService.downloadDocument(projectId, doc.id);
      const url = URL.createObjectURL(result.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName || doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  };

  const handlePreview = async (doc: ProjectDocument) => {
    try {
      const result = await studentService.previewDocument(projectId, doc.id);
      const url = URL.createObjectURL(result.data);
      window.open(url, "_blank");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Preview failed");
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await studentService.deleteDocument(projectId, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete document");
    }
  };

  if (projects.length === 0 && !error) {
    return (
      <div className="flex flex-col gap-6">
        {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <Card>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No research projects yet. Create a project in My Research to upload thesis chapters.</p>
          </div>
        </Card>
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

      {projects.length > 1 && (
        <Card p={false}>
          <div className="flex items-center gap-3 px-5 py-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex-1 bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </Card>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-border hover:border-blue-400 hover:bg-muted/30"}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7 text-blue-600 animate-bounce"/></div>
            <p className="font-bold text-foreground">Uploading...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        ) : (
          <>
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${dragging ? "bg-blue-100" : "bg-muted"}`}>
              <Upload className={`w-7 h-7 ${dragging ? "text-blue-600" : "text-muted-foreground"}`}/>
            </div>
            <p className="font-bold text-foreground mb-1">Upload Thesis Chapter</p>
            <p className="text-sm text-muted-foreground">Drag &amp; drop PDF or DOCX · Max 100 MB</p>
          </>
        )}
        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleFileSelect} disabled={uploading} />
      </div>

      <Card p={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">Uploaded Files</h3>
        </div>
        {loadingDocs ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No files uploaded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {["File", "Type", "Size", "Date", "Uploader", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
    d.fileType?.toLowerCase() === "pdf"
      ? "bg-red-50 dark:bg-red-900/20 text-red-600"
      : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
  }`}
>
  {d.fileType?.toLowerCase() === "pdf"
    ? "PDF"
    : d.fileType?.toLowerCase() === "docx"
      ? "DOCX"
      : d.fileType?.toUpperCase() || "FILE"}
</div>
                        <span className="text-xs font-semibold text-foreground">{d.fileName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><Badge variant="outline">{d.fileType}</Badge></td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{(d.fileSize / 1024).toFixed(1)} KB</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{d.uploaderName}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <button onClick={() => handlePreview(d)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center" title="Preview">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground"/>
                        </button>
                        <button onClick={() => handleDownload(d)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center" title="Download">
                          <Download className="w-3.5 h-3.5 text-muted-foreground"/>
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center" title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-red-500"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}