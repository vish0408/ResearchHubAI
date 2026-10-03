export interface UploadDocumentRequest {
  fileName: string;
  fileType: string;
  content: string;
  researchArea: string;
}

export interface AnalyzeDocumentRequest {
  documentId: string;
  researchArea: string;
}

// Overall literature review analysis
// Analyzes all papers belonging to one LiteratureReview
export interface AnalyzeLiteratureReviewRequest {
  literatureReviewId: string;
  researchArea: string;
}

export interface SummarizeRequest {
  documentId: string;
}

export interface CompareRequest {
  documentIds: string[];
}

export interface ResearchGapsRequest {
  literatureReviewId?: string;
  researchArea: string;
  existingWorkSummary?: string;
}

export interface ExtractKeywordsRequest {
  documentId: string;
}

export interface GenerateRelatedWorkRequest {
  literatureReviewId?: string;
  researchArea: string;
  documentSummaries?: string;
}

export interface UploadedDocumentResponse {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  title: string | null;
  authors: string | null;
  abstract: string | null;
  doi: string | null;
  publicationYear: number | null;
  conference: string | null;
  journal: string | null;
  summary: string | null;
  keywords: string | null;
  researchContributions: string | null;
  methodologySummary: string | null;
  strengths: string | null;
  weaknesses: string | null;
  limitations: string | null;
  futureWork: string | null;
  noveltyScore: string | null;
  createdAt: string;
}

export interface LiteratureReviewResponse {
  id: string;
  title: string;
  researchArea: string;
  executiveSummary: string | null;
  researchGaps: string | null;
  relatedWork: string | null;
  comparisonResults: string | null;
  status: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string | null;
  documents: UploadedDocumentResponse[];
}

export const RESEARCH_AREAS = [
  "Computer Science",
  "Engineering",
  "Medical",
  "Biology",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Economics",
  "Psychology",
  "Education",
  "Environmental Science",
  "Materials Science",
  "Neuroscience",
  "Artificial Intelligence",
];