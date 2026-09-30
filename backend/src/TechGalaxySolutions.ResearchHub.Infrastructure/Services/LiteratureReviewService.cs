using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TechGalaxySolutions.ResearchHub.Application.DTOs.AI;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Literature;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Infrastructure.AI;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class LiteratureReviewService : ILiteratureReviewService
{
    private readonly ApplicationDbContext _context;
    private readonly AIProviderFactory _providerFactory;
    private readonly ILogger<LiteratureReviewService> _logger;

    public LiteratureReviewService(
        ApplicationDbContext context,
        AIProviderFactory providerFactory,
        ILogger<LiteratureReviewService> logger)
    {
        _context = context;
        _providerFactory = providerFactory;
        _logger = logger;
    }

    public async Task<UploadedDocumentResponse> UploadDocumentAsync(Guid userId, UploadDocumentRequest request)
    {
        var user = await _context.Set<User>().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found");

        var parseResult = LiteratureDocumentParser.Parse(request.Content, request.FileName, request.FileType);

        // Find or create literature review
        var review = await _context.Set<LiteratureReview>()
    .FirstOrDefaultAsync(l =>
        l.StudentId == userId &&
        l.ResearchArea == request.ResearchArea &&
        l.Status == "Draft" &&
        !l.IsDeleted);

        if (review is null)
        {
            review = new LiteratureReview
            {
                StudentId = userId,
                Title = $"Literature Review - {request.ResearchArea}",
                ResearchArea = request.ResearchArea,
                Status = "Draft",
            };
            _context.Set<LiteratureReview>().Add(review);
            await _context.SaveChangesAsync();
        }

        var document = new UploadedDocument
        {
            LiteratureReviewId = review.Id,
            FileName = parseResult.FileName,
            FileType = parseResult.FileType,
            FileSize = request.Content.Length,
            StoragePath = "upload/" + Guid.NewGuid(),
            ExtractedText = parseResult.ExtractedText,
            Title = parseResult.Title,
            Authors = parseResult.Authors,
            Abstract = parseResult.Abstract,
            Sections = parseResult.Sections,
            References = parseResult.References,
            Doi = parseResult.Doi,
            PublicationYear = parseResult.PublicationYear,
            Conference = parseResult.Conference,
            Journal = parseResult.Journal,
            UploadedByUserId = userId,
        };

        _context.Set<UploadedDocument>().Add(document);
        await _context.SaveChangesAsync();

        // Create chunks
        var chunks = ChunkText(parseResult.ExtractedText, 2000);    
        for (var i = 0; i < chunks.Count; i++)
        {
            _context.Set<DocumentChunk>().Add(new DocumentChunk
            {
                UploadedDocumentId = document.Id,
                ChunkIndex = i,
                Content = chunks[i],
                TokenCount = chunks[i].Split(' ').Length,
            });
        }
        await _context.SaveChangesAsync();

        return MapDocument(document);
    }

    public async Task<UploadedDocumentResponse> AnalyzeDocumentAsync(Guid userId, AnalyzeDocumentRequest request)
    {
        var doc = await _context.Set<UploadedDocument>()
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.UploadedByUserId == userId)
            ?? throw new KeyNotFoundException("Document not found");

        var provider = _providerFactory.GetDefaultProvider();
        var text = doc.ExtractedText.Length > 8000 ? doc.ExtractedText[..8000] : doc.ExtractedText;

        var prompt = $@"You are a research paper analyst. Analyze the following paper and provide:

1. RESEARCH CONTRIBUTIONS - What novel contributions does this paper make?
2. METHODOLOGY SUMMARY - What research methodology was used?
3. STRENGTHS - What are the key strengths of this paper?
4. WEAKNESSES - What are the limitations or weaknesses?
5. LIMITATIONS - What limitations does the authors acknowledge?
6. FUTURE WORK - What future work is suggested?
7. NOVELTY SCORE - Rate 1-10 and explain why

RESEARCH AREA: {request.ResearchArea}

PAPER CONTENT:
{text}

Format with clear section headers using ### markers.";

        var aiRequest = new AIRequest
        {
            Messages = new() { new() { Role = "user", Content = prompt } },
            Options = new() { Temperature = 0.5,MaxTokens = 2048 },
        };

        var response = await provider.SendAsync(aiRequest);

        doc.ResearchContributions = ExtractSection(response.Content, "RESEARCH CONTRIBUTIONS");
        doc.MethodologySummary = ExtractSection(response.Content, "METHODOLOGY SUMMARY");
        doc.Strengths = ExtractSection(response.Content, "STRENGTHS");
        doc.Weaknesses = ExtractSection(response.Content, "WEAKNESSES");
        doc.Limitations = ExtractSection(response.Content, "LIMITATIONS");
        doc.FutureWork = ExtractSection(response.Content, "FUTURE WORK");
        doc.NoveltyScore = ExtractSection(response.Content, "NOVELTY SCORE");

        // Save analysis history
        await SaveAnalysisHistory(doc.LiteratureReviewId, "Analyze", text, response.Content, provider.ProviderType.ToString());

        await _context.SaveChangesAsync();
        return MapDocument(doc);
    }

   public async Task<UploadedDocumentResponse> SummarizeDocumentAsync(
    Guid userId,
    SummarizeRequest request)
{
    var doc = await _context.Set<UploadedDocument>()
        .FirstOrDefaultAsync(
            d => d.Id == request.DocumentId &&
                 d.UploadedByUserId == userId)
        ?? throw new KeyNotFoundException("Document not found");

    var provider = _providerFactory.GetDefaultProvider();

    var text = doc.ExtractedText.Length > 8000
        ? doc.ExtractedText[..8000]
        : doc.ExtractedText;

    var prompt = $@"You are a research paper summarizer. Generate a comprehensive summary of the following paper.

Include:
1. EXECUTIVE SUMMARY - 2-3 paragraph overview
2. KEY FINDINGS - Bullet points of main findings
3. MAIN CONCLUSION - What did the authors conclude?

PAPER CONTENT:
{text}

Format with ### markers.";

    var aiRequest = new AIRequest
    {
        Messages = new()
        {
            new()
            {
                Role = "user",
                Content = prompt
            }
        },
       Options = new()
{
    Temperature = 0.4,
    MaxTokens = 1024
},

    };

    var response = await provider.SendAsync(aiRequest);

    // Clean AI response once
    var cleanedSummary = CleanSummary(response.Content);

    // Update document summary
    doc.Summary = cleanedSummary;

    // Update parent literature review summary
    var review = await _context.Set<LiteratureReview>()
        .FirstOrDefaultAsync(
            l => l.Id == doc.LiteratureReviewId);

    if (review is not null)
    {
        // Replace instead of appending.
        // This prevents duplicate summaries on re-analysis.
        review.ExecutiveSummary = cleanedSummary;
    }

    await SaveAnalysisHistory(
        doc.LiteratureReviewId,
        "Summarize",
        text,
        response.Content,
        provider.ProviderType.ToString());

    await _context.SaveChangesAsync();

    return MapDocument(doc);
}

    public async Task<LiteratureReviewResponse> CompareDocumentsAsync(Guid userId, CompareRequest request)
    {
        var docs = await _context.Set<UploadedDocument>()
            .Where(d => request.DocumentIds.Contains(d.Id) && d.UploadedByUserId == userId)
            .ToListAsync();

        if (docs.Count < 2)
            throw new InvalidOperationException("At least 2 documents are required for comparison");

        var provider = _providerFactory.GetDefaultProvider();
        var summaries = string.Join("\n\n---\n\n", docs.Select(d =>
            $"Paper: {d.Title ?? d.FileName}\nAbstract: {(d.Abstract ?? d.ExtractedText)[..Math.Min(1500, (d.Abstract ?? d.ExtractedText).Length)]}"));
    
        var prompt = $@"Compare the following research papers and provide:

1. COMPARISON TABLE - Create a markdown table comparing: Research Focus, Methodology, Key Findings, Strengths, Limitations
2. KEY DIFFERENCES - What are the major differences between these papers?
3. COMMON THEMES - What themes or approaches are common across papers?
4. COMPLEMENTARY ASPECTS - How do these papers complement each other?

PAPERS:
{summaries}

Format with ### markers.";

        var aiRequest = new AIRequest
        {
            Messages = new() { new() { Role = "user", Content = prompt } },
            Options = new() { Temperature = 0.5, MaxTokens = 4096 },
        };

        var response = await provider.SendAsync(aiRequest);

        // Create or update review
        var reviewId = docs.First().LiteratureReviewId;
        var review = await _context.Set<LiteratureReview>()
            .Include(l => l.Documents)
            .FirstOrDefaultAsync(l => l.Id == reviewId)
            ?? throw new KeyNotFoundException("Literature review not found");

        review.ComparisonResults = response.Content;
        await SaveAnalysisHistory(reviewId, "Compare", summaries, response.Content, provider.ProviderType.ToString());
        await _context.SaveChangesAsync();

        return MapReview(review);
    }

    public async Task<LiteratureReviewResponse> FindResearchGapsAsync(
    Guid userId,
    ResearchGapsRequest request)
{
    Console.WriteLine(
        $"[Research Gaps] Started | ReviewId: {request.LiteratureReviewId} | Area: {request.ResearchArea}");

    var provider = _providerFactory.GetDefaultProvider();

    List<UploadedDocument> docs;

    // If a specific literature review was selected,
    // use only documents belonging to that review.
    if (request.LiteratureReviewId.HasValue)
    {
        docs = await _context.Set<UploadedDocument>()
            .Where(d =>
                d.LiteratureReviewId == request.LiteratureReviewId.Value &&
                d.UploadedByUserId == userId &&
                !d.IsDeleted)
            .ToListAsync();
    }
    else
    {
        // Otherwise use the student's uploaded literature documents.
        docs = await _context.Set<UploadedDocument>()
            .Where(d =>
                d.UploadedByUserId == userId &&
                !d.IsDeleted)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    if (docs.Count == 0)
    {
        throw new InvalidOperationException(
            "No uploaded literature documents were found. Please upload literature documents before finding research gaps.");
    }

    // Build literature context for AI
    var existingWork = string.Join(
        "\n\n",
        docs.Select(d =>
        {
            var content =
                !string.IsNullOrWhiteSpace(d.Summary)
                    ? d.Summary
                    : !string.IsNullOrWhiteSpace(d.Abstract)
                        ? d.Abstract
                        : d.ExtractedText ?? "";

            if (content.Length > 1200)
                content = content[..1200];

            return $"- {d.Title ?? d.FileName}: {content}";
        }));

        Console.WriteLine(
    $"[Research Gaps] Existing work preview:\n{existingWork[..Math.Min(existingWork.Length, 2000)]}");

    // Keep the AI prompt reasonably small.
    if (existingWork.Length > 6000)
        existingWork = existingWork[..6000];

    if (string.IsNullOrWhiteSpace(existingWork))
    {
        throw new InvalidOperationException(
            "The uploaded literature does not contain enough text for research gap analysis.");
    }

    Console.WriteLine(
        $"[Research Gaps] Documents: {docs.Count} | Context length: {existingWork.Length}");

    var prompt = $@"You are an academic research gap analyst.

Research area:
{request.ResearchArea}

Based ONLY on the literature provided below, identify research gaps.

Provide:

1. RESEARCH GAPS
List 5 specific gaps that are not adequately addressed.

2. OPPORTUNITIES
Explain the research opportunity associated with each gap.

3. RECOMMENDATIONS
Suggest a practical research direction for each gap.

4. PRIORITY
Rate each gap as High, Medium, or Low.

IMPORTANT:
- Do not invent information that is not supported by the provided literature.
- Clearly distinguish established findings from possible research opportunities.
- Keep the response concise and academically useful.

EXISTING LITERATURE:
{existingWork}
";

    var aiRequest = new AIRequest
    {
        Messages = new()
        {
            new()
            {
                Role = "user",
                Content = prompt
            }
        },
        Options = new()
        {
            Temperature = 0.4,
            MaxTokens = 2500
        }
    };

    Console.WriteLine("[Research Gaps] Sending request to AI...");
    
    Console.WriteLine(
    $"[Research Gaps] Prompt contains EXISTING LITERATURE: " +
    $"{prompt.Contains("EXISTING LITERATURE:", StringComparison.OrdinalIgnoreCase)}");

Console.WriteLine(
    $"[Research Gaps] Prompt length: {prompt.Length}");
    var response = await provider.SendAsync(aiRequest);

    Console.WriteLine("[Research Gaps] AI response received.");

    LiteratureReview review;

    if (request.LiteratureReviewId.HasValue)
    {
        review = await _context.Set<LiteratureReview>()
            .FirstOrDefaultAsync(
                l => l.Id == request.LiteratureReviewId.Value &&
                     l.StudentId == userId &&
                     !l.IsDeleted)
            ?? throw new KeyNotFoundException(
                "Literature review not found");
    }
    else
    {
        review = await _context.Set<LiteratureReview>()
            .FirstOrDefaultAsync(
                l =>
                    l.StudentId == userId &&
                    l.ResearchArea == request.ResearchArea &&
                    l.Status == "Draft" &&
                    !l.IsDeleted);

        if (review is null)
        {
            review = new LiteratureReview
            {
                StudentId = userId,
                Title = $"Literature Review - {request.ResearchArea}",
                ResearchArea = request.ResearchArea,
                Status = "Draft"
            };

            _context.Set<LiteratureReview>().Add(review);
        }
    }

    review.ResearchGaps = CleanResearchGaps(response.Content);

    if (request.LiteratureReviewId.HasValue)
    {
        await SaveAnalysisHistory(
            review.Id,
            "ResearchGaps",
            existingWork,
            response.Content,
            provider.ProviderType.ToString());
    }

    await _context.SaveChangesAsync();

    // Reload documents so MapReview gets them.
    await _context.Entry(review)
        .Collection(r => r.Documents)
        .LoadAsync();

    return MapReview(review);
}
// 
private static string CleanResearchGaps(string content)
{
    if (string.IsNullOrWhiteSpace(content))
        return string.Empty;

    var result = content.Trim();

    result = result
        .Replace("### 1. RESEARCH GAPS", "1. RESEARCH GAPS", StringComparison.OrdinalIgnoreCase)
        .Replace("### 2. OPPORTUNITIES", "2. OPPORTUNITIES", StringComparison.OrdinalIgnoreCase)
        .Replace("### 3. RECOMMENDATIONS", "3. RECOMMENDATIONS", StringComparison.OrdinalIgnoreCase)
        .Replace("### 4. PRIORITY", "4. PRIORITY", StringComparison.OrdinalIgnoreCase)
        .Replace("### RESEARCH GAPS", "RESEARCH GAPS", StringComparison.OrdinalIgnoreCase)
        .Replace("### OPPORTUNITIES", "OPPORTUNITIES", StringComparison.OrdinalIgnoreCase)
        .Replace("### RECOMMENDATIONS", "RECOMMENDATIONS", StringComparison.OrdinalIgnoreCase)
        .Replace("### PRIORITY", "PRIORITY", StringComparison.OrdinalIgnoreCase);

    result = result.Replace("---", "");

    result = System.Text.RegularExpressions.Regex.Replace(
        result,
        @"\*\*(.*?)\*\*",
        "$1");

    return result.Trim();
}


public async Task<UploadedDocumentResponse> ExtractKeywordsAsync(
    Guid userId,
    ExtractKeywordsRequest request)
{
    var doc = await _context.Set<UploadedDocument>()
        .FirstOrDefaultAsync(
            d => d.Id == request.DocumentId &&
                 d.UploadedByUserId == userId)
        ?? throw new KeyNotFoundException("Document not found");

    var provider = _providerFactory.GetDefaultProvider();

    var sourceText = doc.Abstract ?? doc.ExtractedText;

    var text = sourceText.Length > 5000
        ? sourceText[..5000]
        : sourceText;

    var prompt = $"""
        You are an expert academic research assistant.

        Extract 10-15 concise and meaningful KEYWORDS from the research paper below.

        IMPORTANT RULES:
        - Return ONLY the keywords.
        - Return them as a comma-separated list.
        - Each keyword must be a short research term or noun phrase.
        - Prefer 1-5 words per keyword.
        - Do NOT return sentences.
        - Do NOT return explanations.
        - Do NOT include numbering such as "1.", "2.", "10.", etc.
        - Do NOT include section numbers.
        - Do NOT copy numbered headings from the paper.
        - Do NOT include long phrases from the paper.
        - Do NOT include parenthetical explanations.
        - Focus on:
          * research domain
          * methodology
          * techniques
          * tools
          * algorithms
          * evaluation methods
          * important concepts

        GOOD EXAMPLE:
        Software Testing, Embedded Systems, Test Case Generation, Black-box Testing, White-box Testing, Verification, Validation, Software Quality

        BAD EXAMPLE:
        10. Test case generation (Technique/Tool aspect) 11. Verification and Validation

        PAPER TEXT:
        {text}
        """;

    var aiRequest = new AIRequest
    {
        Messages = new()
        {
            new()
            {
                Role = "user",
                Content = prompt
            }
        },
        Options = new()
        {
            Temperature = 0.2,
            MaxTokens = 300
        }
    };

    var response = await provider.SendAsync(aiRequest);

    var keywords = CleanKeywords(response.Content);

    doc.Keywords = string.Join(", ", keywords);

    await SaveAnalysisHistory(
        doc.LiteratureReviewId,
        "ExtractKeywords",
        text,
        doc.Keywords,
        provider.ProviderType.ToString());

    await _context.SaveChangesAsync();

    return MapDocument(doc);
}


private static List<string> CleanKeywords(string content)
{
    if (string.IsNullOrWhiteSpace(content))
        return new List<string>();

    var items = content
        .Replace("\r", "")
        .Split(new[] { ',', '\n', ';' }, StringSplitOptions.RemoveEmptyEntries)
        .Select(x => x.Trim())
        .ToList();

    var keywords = new List<string>();

    foreach (var item in items)
    {
        var keyword = item;

        // Remove numbering: "10. Test case generation"
        keyword = System.Text.RegularExpressions.Regex.Replace(
            keyword,
            @"^\s*\d+[\.\)\-:]\s*",
            "");

        // Remove markdown bullets
        keyword = System.Text.RegularExpressions.Regex.Replace(
            keyword,
            @"^\s*[-*•]\s*",
            "");

        // Remove parenthetical explanations
        keyword = System.Text.RegularExpressions.Regex.Replace(
            keyword,
            @"\s*\([^)]*\)",
            "");

        keyword = keyword.Trim(
            ' ', '"', '\'', '.', ':', '-', '–', '—');

        // Remove common AI instruction leakage
        var lower = keyword.ToLowerInvariant();

        if (lower.Contains("potential candidates") ||
            lower.Contains("noun phrases") ||
            lower.Contains("keywords") ||
            lower.Contains("key terms") ||
            lower.Contains("key concepts") ||
            lower.Contains("here are") ||
            lower.Contains("possible keywords"))
        {
            continue;
        }

        // Ignore empty values
        if (string.IsNullOrWhiteSpace(keyword))
            continue;

        // Keep keywords concise
        var wordCount = keyword
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Length;

        if (wordCount > 6)
            continue;

        if (keyword.Length > 80)
            continue;

        // Avoid duplicate keywords
        if (!keywords.Contains(keyword, StringComparer.OrdinalIgnoreCase))
        {
            keywords.Add(keyword);
        }

        if (keywords.Count == 15)
            break;
    }

    return keywords;
}


    public async Task<LiteratureReviewResponse> GenerateRelatedWorkAsync(Guid userId, GenerateRelatedWorkRequest request)
    {
        var provider = _providerFactory.GetDefaultProvider();
        var summaries = request.DocumentSummaries ?? "";

        if (request.LiteratureReviewId.HasValue)
        {
            var docs = await _context.Set<UploadedDocument>()
                .Where(d => d.LiteratureReviewId == request.LiteratureReviewId.Value)
                .ToListAsync();

            summaries = string.Join("\n\n", docs.Select(d =>
                $"- {d.Title ?? d.FileName}: {(d.Summary ?? d.Abstract ?? d.ExtractedText)[..Math.Min(2000, (d.Summary ?? d.Abstract ?? d.ExtractedText).Length)]}"));
        }

        var prompt = $@"You are a research writer. Generate a comprehensive 'Related Work' section for a research paper in {request.ResearchArea}.

Based on the following papers, write an academic Related Work section that:
1. Groups related papers by theme/approach
2. Highlights evolution of research in this area
3. Identifies where current work differs from existing literature
4. Cites papers in proper academic format

SOURCES:
{summaries}

Write 3-5 paragraphs of formal academic text.";

        var aiRequest = new AIRequest
        {
            Messages = new() { new() { Role = "user", Content = prompt } },
            Options = new() { Temperature = 0.6, MaxTokens = 4096 },
        };

        var response = await provider.SendAsync(aiRequest);

        LiteratureReview review;
        if (request.LiteratureReviewId.HasValue)
        {
            review = await _context.Set<LiteratureReview>()
                .FirstOrDefaultAsync(l => l.Id == request.LiteratureReviewId.Value)
                ?? throw new KeyNotFoundException("Literature review not found");
        }
        else
        {
            review = new LiteratureReview
            {
                StudentId = userId,
                Title = $"Related Work - {request.ResearchArea}",
                ResearchArea = request.ResearchArea,
            };
            _context.Set<LiteratureReview>().Add(review);
        }

        review.RelatedWork = response.Content;

        if (request.LiteratureReviewId.HasValue)
            await SaveAnalysisHistory(request.LiteratureReviewId.Value, "RelatedWork", summaries, response.Content, provider.ProviderType.ToString());

        await _context.SaveChangesAsync();
        return MapReview(review);
    }

    // public async Task<List<LiteratureReviewResponse>> GetHistoryAsync(Guid userId)
    // {
    //     var reviews = await _context.Set<LiteratureReview>().AsNoTracking()
    //         .Include(l => l.Documents)
    //         .Where(l => l.StudentId == userId && !l.IsDeleted)
    //         .OrderByDescending(l => l.CreatedAt)
    //         .ToListAsync();

    //     return reviews.Select(MapReview).ToList();
    // }


     public async Task<List<LiteratureReviewResponse>> GetHistoryAsync(Guid userId)
{
    var allReviews = await _context.Set<LiteratureReview>()
        .AsNoTracking()
        .ToListAsync();

    Console.WriteLine($"[Literature History] Total DB Reviews: {allReviews.Count}");

    foreach (var item in allReviews)
    {
        Console.WriteLine(
            $"ReviewId: {item.Id} | " +
            $"StudentId: {item.StudentId} | " +
            $"IsDeleted: {item.IsDeleted} | " +
            $"Title: {item.Title}"
        );
    }

    var reviews = await _context.Set<LiteratureReview>()
        .AsNoTracking()
        .Include(l => l.Documents)
        .Where(l => l.StudentId == userId && !l.IsDeleted)
        .OrderByDescending(l => l.CreatedAt)
        .ToListAsync();

    Console.WriteLine($"[Literature History] Matching Reviews: {reviews.Count}");

    return reviews.Select(MapReview).ToList();
}



    public async Task<LiteratureReviewResponse> GetByIdAsync(Guid id, Guid userId)
    {
        var review = await _context.Set<LiteratureReview>().AsNoTracking()
            .Include(l => l.Documents)
            .FirstOrDefaultAsync(l => l.Id == id && l.StudentId == userId)
            ?? throw new KeyNotFoundException("Literature review not found");

        return MapReview(review);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var review = await _context.Set<LiteratureReview>()
            .Include(l => l.Documents)
            .FirstOrDefaultAsync(l => l.Id == id && l.StudentId == userId)
            ?? throw new KeyNotFoundException("Literature review not found");

        review.IsDeleted = true;
        review.UpdatedAt = DateTime.UtcNow;

        foreach (var doc in review.Documents)
        {
            doc.IsDeleted = true;
            doc.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    private async Task SaveAnalysisHistory(Guid reviewId, string type, string input, string output, string provider)
    {
        _context.Set<AnalysisHistory>().Add(new AnalysisHistory
        {
            LiteratureReviewId = reviewId,
            AnalysisType = type,
            InputSummary = input.Length > 500 ? input[..500] : input,
            OutputContent = output.Length > 2000 ? output[..2000] : output,
            ProviderUsed = provider,
        });
        await _context.SaveChangesAsync();
    }

    private static List<string> ChunkText(string text, int chunkSize)
    {
        var chunks = new List<string>();
        for (var i = 0; i < text.Length; i += chunkSize)
            chunks.Add(text.Substring(i, Math.Min(chunkSize, text.Length - i)));
        return chunks;
    }

private static string CleanSummary(string content)
{
    if (string.IsNullOrWhiteSpace(content))
        return string.Empty;

    var result = content.Trim();

    result = result
        .Replace("### EXECUTIVE SUMMARY", "Executive Summary", StringComparison.OrdinalIgnoreCase)
        .Replace("### KEY FINDINGS", "Key Findings", StringComparison.OrdinalIgnoreCase)
        .Replace("### MAIN CONCLUSION", "Main Conclusion", StringComparison.OrdinalIgnoreCase)
        .Replace("---", "")
        .Replace("\\*", "*");

    result = System.Text.RegularExpressions.Regex.Replace(
        result,
        @"\*\*(.*?)\*\*",
        "$1");

    return result.Trim();
}

    private static string ExtractSection(string content, string sectionName)
    {
        var idx = content.IndexOf($"### {sectionName}", StringComparison.OrdinalIgnoreCase);
        if (idx < 0) idx = content.IndexOf($"## {sectionName}", StringComparison.OrdinalIgnoreCase);
        if (idx < 0) idx = content.IndexOf($"# {sectionName}", StringComparison.OrdinalIgnoreCase);
        if (idx < 0) idx = content.IndexOf(sectionName + ":", StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return string.Empty;

        var start = content.IndexOf('\n', idx);
        if (start < 0) return string.Empty;

        var end = content.IndexOf("\n### ", start, StringComparison.OrdinalIgnoreCase);
        if (end < 0) end = content.IndexOf("\n## ", start, StringComparison.OrdinalIgnoreCase);
        if (end < 0) end = content.IndexOf("\n# ", start, StringComparison.OrdinalIgnoreCase);
        if (end < 0) end = content.Length;

        return content[start..end].Trim();
    }

    private static UploadedDocumentResponse MapDocument(UploadedDocument d) => new()
    {
        Id = d.Id,
        FileName = d.FileName,
        FileType = d.FileType,
        FileSize = d.FileSize,
        Title = d.Title,
        Authors = d.Authors,
        Abstract = d.Abstract,
        Doi = d.Doi,
        PublicationYear = d.PublicationYear,
        Conference = d.Conference,
        Journal = d.Journal,
        Summary = d.Summary,
        Keywords = d.Keywords,
        ResearchContributions = d.ResearchContributions,
        MethodologySummary = d.MethodologySummary,
        Strengths = d.Strengths,
        Weaknesses = d.Weaknesses,
        Limitations = d.Limitations,
        FutureWork = d.FutureWork,
        NoveltyScore = d.NoveltyScore,
        CreatedAt = d.CreatedAt,
    };

    private static LiteratureReviewResponse MapReview(LiteratureReview r) => new()
{
    Id = r.Id,
    Title = r.Title,
    ResearchArea = r.ResearchArea,

   ExecutiveSummary = CleanSummary(r.ExecutiveSummary ?? ""),
ResearchGaps = CleanResearchGaps(r.ResearchGaps ?? ""),

    RelatedWork = r.RelatedWork,
    ComparisonResults = r.ComparisonResults,
    Status = r.Status ?? "Draft",
    DocumentCount = r.Documents?.Count ?? 0,
    CreatedAt = r.CreatedAt,
    UpdatedAt = r.UpdatedAt,

    Documents = r.Documents?.Select(MapDocument).ToList() ?? new(),
};
}
