namespace TechGalaxySolutions.ResearchHub.Application.DTOs.Literature;

public class UploadDocumentRequest
{
    public string FileName { get; set; } = string.Empty;

    public string FileType { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public string ResearchArea { get; set; } = string.Empty;
}

public class AnalyzeDocumentRequest
{
    public Guid DocumentId { get; set; }

    public string ResearchArea { get; set; } = string.Empty;
}

public class AnalyzeLiteratureReviewRequest
{
    public Guid LiteratureReviewId { get; set; }

    public string ResearchArea { get; set; } = string.Empty;
}

public class SummarizeRequest
{
    public Guid DocumentId { get; set; }
}

public class CompareRequest
{
    public List<Guid> DocumentIds { get; set; } = new();
}

public class ResearchGapsRequest
{
    public Guid? LiteratureReviewId { get; set; }

    public string ResearchArea { get; set; } = string.Empty;

    public string? ExistingWorkSummary { get; set; }
}

public class ExtractKeywordsRequest
{
    public Guid DocumentId { get; set; }
}

public class GenerateRelatedWorkRequest
{
    public Guid? LiteratureReviewId { get; set; }

    public string ResearchArea { get; set; } = string.Empty;

    public string? DocumentSummaries { get; set; }
}

public class LiteratureReviewResponse
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string ResearchArea { get; set; } = string.Empty;

    public string? ExecutiveSummary { get; set; }

    public string? ResearchGaps { get; set; }

    public string? RelatedWork { get; set; }

    public string? ComparisonResults { get; set; }

    public string Status { get; set; } = string.Empty;

    public int DocumentCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public List<UploadedDocumentResponse> Documents { get; set; } = new();
}

public class UploadedDocumentResponse
{
    public Guid Id { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string FileType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    public string? Title { get; set; }

    public string? Authors { get; set; }

    public string? Abstract { get; set; }

    public string? Doi { get; set; }

    public int? PublicationYear { get; set; }

    public string? Conference { get; set; }

    public string? Journal { get; set; }

    public string? Summary { get; set; }

    public string? Keywords { get; set; }

    public string? ResearchContributions { get; set; }

    public string? MethodologySummary { get; set; }

    public string? Strengths { get; set; }

    public string? Weaknesses { get; set; }

    public string? Limitations { get; set; }

    public string? FutureWork { get; set; }

    public string? NoveltyScore { get; set; }

    public DateTime CreatedAt { get; set; }
}
