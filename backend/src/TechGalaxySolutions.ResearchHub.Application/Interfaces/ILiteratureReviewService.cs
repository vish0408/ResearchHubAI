using TechGalaxySolutions.ResearchHub.Application.DTOs.Literature;

namespace TechGalaxySolutions.ResearchHub.Application.Interfaces;

public interface ILiteratureReviewService
{
    Task<UploadedDocumentResponse> UploadDocumentAsync(Guid userId, UploadDocumentRequest request);

    Task<LiteratureReviewResponse> AnalyzeLiteratureReviewAsync(Guid userId,AnalyzeLiteratureReviewRequest request);

    Task<UploadedDocumentResponse> AnalyzeDocumentAsync(Guid userId, AnalyzeDocumentRequest request);

    Task<UploadedDocumentResponse> SummarizeDocumentAsync(Guid userId, SummarizeRequest request);

    Task<LiteratureReviewResponse> CompareDocumentsAsync(Guid userId, CompareRequest request);

    Task<LiteratureReviewResponse> FindResearchGapsAsync(Guid userId, ResearchGapsRequest request);

    Task<UploadedDocumentResponse> ExtractKeywordsAsync(Guid userId, ExtractKeywordsRequest request);

    Task<LiteratureReviewResponse> GenerateRelatedWorkAsync(Guid userId, GenerateRelatedWorkRequest request);

    Task<List<LiteratureReviewResponse>> GetHistoryAsync(Guid userId);

    Task<LiteratureReviewResponse> GetByIdAsync(Guid id, Guid userId);

    Task DeleteAsync(Guid id, Guid userId);
}
