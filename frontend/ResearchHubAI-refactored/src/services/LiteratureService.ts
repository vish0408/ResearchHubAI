// 

import { apiClient } from "../api/client";

import type {
  UploadDocumentRequest,
  AnalyzeDocumentRequest,
  AnalyzeLiteratureReviewRequest,
  SummarizeRequest,
  CompareRequest,
  ResearchGapsRequest,
  ExtractKeywordsRequest,
  GenerateRelatedWorkRequest,
  UploadedDocumentResponse,
  LiteratureReviewResponse,
} from "../types/Literature";

const BASE = "/literature";

export class LiteratureService {
  // Upload a paper
  async upload(
    request: UploadDocumentRequest
  ): Promise<UploadedDocumentResponse> {
    const res = await apiClient.post<UploadedDocumentResponse>(
      `${BASE}/upload`,
      request
    );

    if (!res.success || !res.data) {
      throw new Error(res.message || "Upload failed");
    }

    return res.data;
  }

  // Analyze the complete literature review
  // Analyzes ALL papers belonging to the LiteratureReview
  async analyzeReview(
    request: AnalyzeLiteratureReviewRequest
  ): Promise<LiteratureReviewResponse> {
    const res = await apiClient.post<LiteratureReviewResponse>(
      `${BASE}/analyze-review`,
      request
    );

    if (!res.success || !res.data) {
      throw new Error(
        res.message || "Literature review analysis failed"
      );
    }

    return res.data;
  }

  // Analyze one individual paper
  async analyze(
    request: AnalyzeDocumentRequest
  ): Promise<UploadedDocumentResponse> {
    const res = await apiClient.post<UploadedDocumentResponse>(
      `${BASE}/analyze`,
      request
    );

    if (!res.success || !res.data) {
      throw new Error(res.message || "Analysis failed");
    }

    return res.data;
  }

  // Summarize one individual paper
  async summarize(
    request: SummarizeRequest
  ): Promise<UploadedDocumentResponse> {
    const res = await apiClient.post<UploadedDocumentResponse>(
      `${BASE}/summarize`,
      request
    );

    if (!res.success || !res.data) {
      throw new Error(
        res.message || "Summarization failed"
      );
    }

    return res.data;
  }

  // Compare selected papers
  async compare(
    request: CompareRequest
  ): Promise<LiteratureReviewResponse> {
    const res = await apiClient.post<LiteratureReviewResponse>(
      `${BASE}/compare`,
      request
    );

    if (!res.success || !res.data) {
      throw new Error(
        res.message || "Comparison failed"
      );
    }

    return res.data;
  }

  // Find research gaps across the literature review
  async findResearchGaps(
    request: ResearchGapsRequest
  ): Promise<LiteratureReviewResponse> {
    const res = await apiClient.post<LiteratureReviewResponse>(
      `${BASE}/research-gaps`,
      request
    );

    if (!res.success || !res.data) {
      throw new Error(
        res.message || "Research gaps analysis failed"
      );
    }

    return res.data;
  }

  // Extract keywords from one paper
  async extractKeywords(
    request: ExtractKeywordsRequest
  ): Promise<UploadedDocumentResponse> {
    const res = await apiClient.post<UploadedDocumentResponse>(
      `${BASE}/extract-keywords`,
      request
    );

    if (!res.success || !res.data) {
      throw new Error(
        res.message || "Keyword extraction failed"
      );
    }

    return res.data;
  }

  // Generate related work
  async generateRelatedWork(
    request: GenerateRelatedWorkRequest
  ): Promise<LiteratureReviewResponse> {
    const res = await apiClient.post<LiteratureReviewResponse>(
      `${BASE}/generate-related-work`,
      request
    );

    if (!res.success || !res.data) {
      throw new Error(
        res.message || "Generation failed"
      );
    }

    return res.data;
  }

  // Get literature review history
  async getHistory(): Promise<LiteratureReviewResponse[]> {
    const res = await apiClient.get<LiteratureReviewResponse[]>(
      `${BASE}/history`
    );

    if (!res.success || !res.data) {
      throw new Error(
        res.message || "Failed to get history"
      );
    }

    return res.data;
  }

  // Get one literature review
  async getById(
    id: string
  ): Promise<LiteratureReviewResponse> {
    const res = await apiClient.get<LiteratureReviewResponse>(
      `${BASE}/${id}`
    );

    if (!res.success || !res.data) {
      throw new Error(
        res.message || "Literature review not found"
      );
    }

    return res.data;
  }

  // Delete literature review
  async delete(id: string): Promise<void> {
    const res = await apiClient.delete<void>(
      `${BASE}/${id}`
    );

    if (!res.success) {
      throw new Error(
        res.message || "Delete failed"
      );
    }
  }
}

export const literatureService = new LiteratureService();