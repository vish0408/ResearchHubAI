import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  BookOpen, Upload, FileText, Search, Trash2, Loader2,
  Brain, Copy, Download, X,
  ChevronDown, ChevronUp, GitCompare, Lightbulb, Tags, FileSearch,
  Clock, Eye,
} from "lucide-react";
import Card from "../../components/common/Card";
import SectionHead from "../../components/common/SectionHead";
import Badge from "../../components/common/Badge";
import { literatureService } from "../../services/LiteratureService";
import type {
  LiteratureReviewResponse,
} from "../../types/Literature";
import { RESEARCH_AREAS } from "../../types/Literature";

type Tab = "upload" | "analyze" | "gaps" | "compare" | "history";

export default function LiteratureReviewPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [researchArea, setResearchArea] = useState("Computer Science");
  const [documentText, setDocumentText] = useState("");
  const [fileName, setFileName] = useState("");
  const [reviews, setReviews] = useState<LiteratureReviewResponse[]>([]);
  const [currentReview, setCurrentReview] = useState<LiteratureReviewResponse | null>(null);
  const [compareDocIds, setCompareDocIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    literatureService.getHistory().then(setReviews).catch((e) => { if (e instanceof Error) setError(e.message); });
  }, []);

  const handleUpload = useCallback(async () => {
    if (!documentText.trim()) return;
    setError("");
    setLoading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 15, 90));
    }, 200);

    try {
      await literatureService.upload({
        fileName: fileName || "document.txt",
        fileType: fileName?.split(".").pop() || "txt",
        content: documentText,
        researchArea,
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
      setDocumentText("");
      setFileName("");

      // Refresh history
      const hist = await literatureService.getHistory();
      setReviews(hist);
      setActiveTab("analyze");
    } catch (e: unknown) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }, [documentText, fileName, researchArea]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    const isBinary = file.name.endsWith(".pdf") || file.name.endsWith(".docx");
    if (isBinary) {
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        setDocumentText(btoa(binary));
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = () => setDocumentText(reader.result as string);
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async (docId: string) => {
    setAnalyzing(docId);
    setError("");
    try {
      await literatureService.analyze({ documentId: docId, researchArea });
      await literatureService.summarize({ documentId: docId });
      const hist = await literatureService.getHistory();
      setReviews(hist);
    } catch (e: unknown) {
  if (e instanceof DOMException && e.name === "AbortError") {
    setError("AI analysis timed out. Please try again.");
  } else {
    setError(e instanceof Error ? e.message : "Analysis failed");
  }
} finally {
      setAnalyzing(null);
    }
  };

  const handleExtractKeywords = async (docId: string) => {
    setExtracting(docId);
    try {
      await literatureService.extractKeywords({ documentId: docId });
      const hist = await literatureService.getHistory();
      setReviews(hist);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setExtracting(null);
    }
  };

  const handleResearchGaps = async (reviewId?: string) => {
    setLoading(true);
    try {
      const result = await literatureService.findResearchGaps({
        literatureReviewId: reviewId,
        researchArea,
      });
      setCurrentReview(result);
      setShowReview(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Research gaps analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (compareDocIds.length < 2) {
      setError("Select at least 2 documents to compare");
      return;
    }
    setLoading(true);
    try {
      const result = await literatureService.compare({ documentIds: compareDocIds });
      setCurrentReview(result);
      setShowReview(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRelatedWork = async (reviewId?: string) => {
    setLoading(true);
    try {
      const result = await literatureService.generateRelatedWork({
        literatureReviewId: reviewId,
        researchArea,
      });
      setCurrentReview(result);
      setShowReview(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Related work generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await literatureService.delete(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (e) { if (e instanceof Error) setError(e.message); }
  };

  const loadReview = async (id: string) => {
    try {
      const review = await literatureService.getById(id);
      setCurrentReview(review);
      setShowReview(true);
    } catch (e) { if (e instanceof Error) setError(e.message); }
  };

  const handleExportMd = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(/\s+/g, "_") + ".md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredReviews = useMemo(() => reviews.filter(r =>
    r.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    r.researchArea.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  ), [reviews, debouncedSearchQuery]);

  const renderUploadTab = () => (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionHead title="Upload Document" desc="Paste text or upload a file for analysis" />
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Research Area</label>
            <select value={researchArea} onChange={e => setResearchArea(e.target.value)}
              className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary">
              {RESEARCH_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">File Name (optional)</label>
            <input type="text" value={fileName} onChange={e => setFileName(e.target.value)}
              placeholder="document.pdf"
              className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">Drop a file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports TXT, PDF, DOCX</p>
            <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx" className="hidden" onChange={handleFileSelect} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Or paste document text</label>
            <textarea value={documentText} onChange={e => setDocumentText(e.target.value)}
              placeholder="Paste the full text of the research paper here..."
              rows={10}
              className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-y font-mono" />
          </div>
          {uploadProgress > 0 && (
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={handleUpload} disabled={loading || !documentText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload & Process
            </button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAnalyzeTab = () => (
    <div className="flex flex-col gap-5">
      {reviews.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No documents uploaded yet. Start by uploading a paper.</p>
          </div>
        </Card>
      ) : (
        reviews.map(review => (
          <Card key={review.id}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">{review.title}</p>
                  <p className="text-xs text-muted-foreground">{review.researchArea} · {review.documentCount} documents</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadReview(review.id)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteReview(review.id)} className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {review.documents.map(doc => (
                <div key={doc.id} className="p-3 rounded-xl border border-border hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm font-semibold truncate">{doc.title || doc.fileName}</p>
                      {doc.doi && <span className="text-[10px] text-muted-foreground truncate">DOI: {doc.doi}</span>}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAnalyze(doc.id)} disabled={analyzing === doc.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                        {analyzing === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                        Analyze
                      </button>
                      <button onClick={() => handleExtractKeywords(doc.id)} disabled={extracting === doc.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors">
                        {extracting === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tags className="w-3 h-3" />}
                        Keywords
                      </button>
                    </div>
                  </div>
                  {doc.authors && <p className="text-xs text-muted-foreground mb-1">{doc.authors}</p>}
                  {doc.summary && (
                    <div className="mt-2 p-2.5 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs font-semibold mb-1">Summary</p>
                      <p className="text-xs text-muted-foreground line-clamp-3">{doc.summary}</p>
                    </div>
                  )}
                  {doc.keywords && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {doc.keywords.split(",").slice(0, 8).map((k, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{k.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
              <button onClick={() => handleResearchGaps(review.id)} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <Lightbulb className="w-3.5 h-3.5" /> Research Gaps
              </button>
              <button onClick={() => handleGenerateRelatedWork(review.id)} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <FileSearch className="w-3.5 h-3.5" /> Related Work
              </button>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  const renderCompareTab = () => (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionHead title="Compare Documents" desc="Select 2+ documents to compare" />
        <div className="flex flex-col gap-2 mb-4">
          {reviews.flatMap(r => r.documents).map(doc => (
            <label key={doc.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${compareDocIds.includes(doc.id) ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-border hover:border-blue-300"}`}>
              <input type="checkbox" checked={compareDocIds.includes(doc.id)}
                onChange={() => setCompareDocIds(prev => prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id])}
                className="rounded border-border accent-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{doc.title || doc.fileName}</p>
                <p className="text-xs text-muted-foreground">{doc.authors || "Unknown author"}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">{compareDocIds.length} documents selected</p>
          <button onClick={handleCompare} disabled={compareDocIds.length < 2 || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
            Compare
          </button>
        </div>
      </Card>
    </div>
  );

  const renderGapsTab = () => (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionHead title="Research Gap Analysis" desc="Identify gaps and opportunities in your research area" />
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Research Area</label>
            <select value={researchArea} onChange={e => setResearchArea(e.target.value)}
              className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary">
              {RESEARCH_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={() => handleResearchGaps()} disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
            Find Research Gaps
          </button>
        </div>
      </Card>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionHead title="Analysis History"
          action={
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reviews..." className="pl-9 pr-3 py-2 bg-input-background border border-border rounded-xl text-sm outline-none focus:border-primary w-48" />
            </div>
          } />
        {filteredReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No analysis history</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredReviews.map(review => (
              <div key={review.id} className="p-3 rounded-xl border border-border hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}>
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{review.title}</p>
                    <p className="text-xs text-muted-foreground">{review.researchArea} · {new Date(review.createdAt).toLocaleDateString()} · {review.documentCount} docs</p>
                  </div>
                  <Badge variant={review.status === "Draft" ? "info" : "default"}>{review.status}</Badge>
                  {expandedReview === review.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                {expandedReview === review.id && (
                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                    <button onClick={() => loadReview(review.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"><Eye className="w-3 h-3" /> View</button>
                    <button onClick={() => handleResearchGaps(review.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted/50 transition-colors"><Lightbulb className="w-3 h-3" /> Gaps</button>
                    <button onClick={() => handleGenerateRelatedWork(review.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted/50 transition-colors"><FileSearch className="w-3 h-3" /> Related Work</button>
                    <button onClick={() => handleDeleteReview(review.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  const renderReviewModal = () => {
    if (!showReview || !currentReview) return null;
    const sections = [
      { label: "Executive Summary", content: currentReview.executiveSummary },
      { label: "Research Gaps", content: currentReview.researchGaps },
      { label: "Related Work", content: currentReview.relatedWork },
      { label: "Comparison Results", content: currentReview.comparisonResults },
    ].filter(s => s.content);

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4 pt-10" onClick={() => setShowReview(false)}>
        <div className="bg-card rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10 rounded-t-2xl">
            <div>
              <h3 className="font-bold">{currentReview.title}</h3>
              <p className="text-xs text-muted-foreground">{currentReview.researchArea}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleExportMd(sections.map(s => `## ${s.label}\n\n${s.content}\n\n`).join(""), currentReview.title)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors" title="Export Markdown">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => setShowReview(false)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-5 flex flex-col gap-5">
            {currentReview.documents.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Documents Analyzed</p>
                <div className="flex flex-wrap gap-2">
                  {currentReview.documents.map(d => (
                    <span key={d.id} className="text-xs px-2 py-1 rounded-lg bg-muted">{d.title || d.fileName}</span>
                  ))}
                </div>
              </div>
            )}
            {sections.map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold">{s.label}</h4>
                  <button onClick={() => { navigator.clipboard.writeText(s.content ?? ""); }}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border text-sm whitespace-pre-wrap leading-relaxed">
                  {s.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const tabs: { id: Tab; label: string; icon: typeof Upload }[] = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "analyze", label: "Analyze", icon: Brain },
    { id: "compare", label: "Compare", icon: GitCompare },
    { id: "gaps", label: "Gaps", icon: Lightbulb },
    { id: "history", label: "History", icon: Clock },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">AI Literature Review</h2>
            <p className="text-xs text-muted-foreground">Analyze papers, find gaps, generate related work</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${activeTab === tab.id ? "bg-card shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {activeTab === "upload" && renderUploadTab()}
      {activeTab === "analyze" && renderAnalyzeTab()}
      {activeTab === "compare" && renderCompareTab()}
      {activeTab === "gaps" && renderGapsTab()}
      {activeTab === "history" && renderHistoryTab()}

      {renderReviewModal()}
    </div>
  );
}
