// using System.Net.Http.Json;
// using System.Runtime.CompilerServices;
// using System.Text.Json;
// using Microsoft.Extensions.Logging;
// using TechGalaxySolutions.ResearchHub.Application.Configuration;
// using TechGalaxySolutions.ResearchHub.Application.DTOs.AI;
// using TechGalaxySolutions.ResearchHub.Application.Exceptions;
// using TechGalaxySolutions.ResearchHub.Application.Interfaces;

// namespace TechGalaxySolutions.ResearchHub.Infrastructure.AI;

// public class GeminiProvider : IAIProvider
// {
//     private readonly HttpClient _httpClient;
//     private readonly AIProviderSettings _settings;
//     private readonly ILogger<GeminiProvider> _logger;
//     private static readonly JsonSerializerOptions JsonOptions = new()
//     {
//         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
//         PropertyNameCaseInsensitive = true,
//         DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
//     };

//     public GeminiProvider(
//         IHttpClientFactory httpClientFactory,
//         AISettings aiSettings,
//         ILogger<GeminiProvider> logger)
//     {
//         _settings = aiSettings.Providers.GetValueOrDefault("Gemini") ?? throw new InvalidOperationException("Gemini provider settings not found");
//         _logger = logger;

//         var key = _settings.ApiKey;
//         _logger.LogInformation("Gemini API key loaded = {Loaded}, length = {Length}, last 4 chars = {Last4}",
//             !string.IsNullOrEmpty(key),
//             key?.Length ?? 0,
//             key is { Length: >= 4 } ? key[^4..] : "N/A");

//        _httpClient = httpClientFactory.CreateClient(nameof(GeminiProvider));
// _httpClient.Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);
// _httpClient.BaseAddress = new Uri(_settings.Endpoint.TrimEnd('/') + "/");
//     }

//     public AIProviderType ProviderType => AIProviderType.Gemini;

//     public bool IsEnabled => !string.IsNullOrEmpty(_settings.ApiKey);

//    public async Task<AIResponse> SendAsync(
//     AIRequest request,
//     CancellationToken cancellationToken = default)
// {
//     if (!IsEnabled)
//         throw new AiException(
//             ProviderType,
//             "Gemini provider is not configured (missing API key)");

//     var body = BuildRequestBody(request);

//     var models = new List<string>();

//     if (!string.IsNullOrWhiteSpace(_settings.Model))
//         models.Add(_settings.Model);

//     if (_settings.FallbackModels is not null)
//     {
//         models.AddRange(
//             _settings.FallbackModels
//                 .Where(m => !string.IsNullOrWhiteSpace(m)));
//     }

//     models = models
//         .Distinct(StringComparer.OrdinalIgnoreCase)
//         .ToList();

//     if (models.Count == 0)
//         throw new AiException(
//             ProviderType,
//             "No Gemini model is configured.");

//     AiException? last503Exception = null;

//     for (var modelIndex = 0; modelIndex < models.Count; modelIndex++)
//     {
//         var model = models[modelIndex];

//         _logger.LogInformation(
//             "Gemini model selected for SendAsync: {Model} ({Current}/{Total})",
//             model,
//             modelIndex + 1,
//             models.Count);

//         try
//         {
//             return await SendWithModelAsync(
//                 request,
//                 body,
//                 model,
//                 cancellationToken);
//         }
//         catch (AiException ex)
//             when (ex.HttpStatusCode == 503 && modelIndex < models.Count - 1)
//         {
//             last503Exception = ex;

//             _logger.LogWarning(
//                 "Gemini model {Model} returned HTTP 503 after retries. " +
//                 "Trying fallback model {FallbackModel}.",
//                 model,
//                 models[modelIndex + 1]);
//         }
//     }

//     if (last503Exception is not null)
//         throw last503Exception;

//     throw new AiException(
//         ProviderType,
//         "Gemini request failed for all configured models.");
// }

// private async Task<AIResponse> SendWithModelAsync(
//     AIRequest request,
//     object body,
//     string model,
//     CancellationToken cancellationToken)
// {
//     var url = $"models/{model}:generateContent?key={_settings.ApiKey}";
//     var timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);

//     using var timeoutCts =
//         CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

//     timeoutCts.CancelAfter(timeout);

//     return await RetryPolicy.ExecuteWithRetryAsync(
//         async () =>
//         {
//             _logger.LogInformation(
//                 "Gemini SendAsync -> POST {BaseAddress}{Url}",
//                 _httpClient.BaseAddress,
//                 url.Replace(_settings.ApiKey, "***"));

//             var bodyJson = JsonSerializer.Serialize(body, JsonOptions);

//             _logger.LogInformation(
//                 "Gemini SendAsync request body:\n{Body}",
//                 bodyJson);

//             using var response = await _httpClient.PostAsJsonAsync(
//                 url,
//                 body,
//                 JsonOptions,
//                 timeoutCts.Token);

//             _logger.LogInformation(
//                 "Gemini SendAsync response status: {(int)response.StatusCode} {response.ReasonPhrase}",
//                 (int)response.StatusCode,
//                 response.ReasonPhrase);

//             foreach (var h in response.Headers)
//             {
//                 _logger.LogInformation(
//                     "Gemini SendAsync response header {Key}: {Value}",
//                     h.Key,
//                     string.Join(", ", h.Value));
//             }

//             var responseBody =
//                 await response.Content.ReadAsStringAsync(timeoutCts.Token);

//             _logger.LogInformation(
//                 "Gemini SendAsync response body:\n{Body}",
//                 responseBody);

//             // 429 - Rate limit / quota
//             if (response.StatusCode ==
//                 System.Net.HttpStatusCode.TooManyRequests)
//             {
//                 var retryAfter = response.Headers.RetryAfter?.Delta;

//                 if (responseBody.Contains(
//                         "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
//                         StringComparison.OrdinalIgnoreCase)
//                     || responseBody.Contains(
//                         "quota exceeded",
//                         StringComparison.OrdinalIgnoreCase)
//                     || responseBody.Contains(
//                         "quota_exceeded",
//                         StringComparison.OrdinalIgnoreCase))
//                 {
//                     throw new AiException(
//                         ProviderType,
//                         "Gemini daily free-tier quota has been exhausted. " +
//                         "Please wait for the quota to reset or check your " +
//                         "Google AI Studio plan/billing.",
//                         (int)response.StatusCode);
//                 }

//                 throw new AiRateLimitException(
//                     ProviderType,
//                     retryAfter);
//             }

//             // Other non-success responses
//             if (!response.IsSuccessStatusCode)
//             {
//                 var errorMsg =
//                     $"Gemini API returned {(int)response.StatusCode}";

//                 if (!string.IsNullOrEmpty(responseBody))
//                 {
//                     try
//                     {
//                         using var errorDoc =
//                             JsonDocument.Parse(responseBody);

//                         errorMsg =
//                             errorDoc.RootElement.TryGetProperty(
//                                 "error",
//                                 out var err)
//                             && err.TryGetProperty(
//                                 "message",
//                                 out var msg)
//                                 ? msg.GetString() ?? errorMsg
//                                 : errorMsg;
//                     }
//                     catch
//                     {
//                         errorMsg +=
//                             $": {responseBody[..Math.Min(
//                                 responseBody.Length,
//                                 200)]}";
//                     }
//                 }

//                 throw new AiException(
//                     ProviderType,
//                     errorMsg,
//                     (int)response.StatusCode);
//             }

//             // Deserialize successful response
//             var json =
//                 JsonSerializer.Deserialize<GeminiResponse>(
//                     responseBody,
//                     JsonOptions);

//             if (json?.Candidates is null ||
//                 json.Candidates.Count == 0)
//             {
//                 throw new AiException(
//                     ProviderType,
//                     "Empty response from Gemini");
//             }

//             var candidate = json.Candidates[0];

//             var text =
//                 candidate.Content?.Parts?
//                     .FirstOrDefault()?.Text
//                 ?? string.Empty;

//             return new AIResponse
//             {
//                 Content = text,
//                 Model = model,

//                 Usage = json.UsageMetadata is null
//                     ? null
//                     : new AIUsage
//                     {
//                         PromptTokens =
//                             json.UsageMetadata.PromptTokenCount,

//                         CompletionTokens =
//                             json.UsageMetadata.CandidatesTokenCount,

//                         TotalTokens =
//                             json.UsageMetadata.TotalTokenCount,
//                     },

//                 FinishReason = candidate.FinishReason,
//             };
//         },
//         _settings.MaxRetries,
//         _logger,
//         $"Gemini.SendAsync[{model}]",
//         timeoutCts.Token);
// }
//     public async IAsyncEnumerable<AIStreamChunk> StreamAsync(
//         AIRequest request,
//         [EnumeratorCancellation] CancellationToken cancellationToken = default)
//     {
//         if (!IsEnabled)
//             throw new AiException(ProviderType, "Gemini provider is not configured (missing API key)");

//         var body = BuildRequestBody(request);
//         var model = _settings.Model;
//         var url = $"models/{model}:streamGenerateContent?alt=sse&key={_settings.ApiKey}";
//         var timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);

//         using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
//         timeoutCts.CancelAfter(timeout);

//         // _logger.LogInformation("Gemini StreamAsync -> POST {BaseAddress}{Url}", _httpClient.BaseAddress, url.Replace(_settings.ApiKey, "***"));
//         // var bodyJson = JsonSerializer.Serialize(body, JsonOptions);
//         // _logger.LogInformation("Gemini StreamAsync request body:\n{Body}", bodyJson);

//         // using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
//         // {
//         //     Content = JsonContent.Create(body, options: JsonOptions),
//         // };

//         // using var response = await RetryPolicy.ExecuteWithRetryAsync(
//         //     () => _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, timeoutCts.Token),
//         //     _settings.MaxRetries,
//         //     _logger,
//         //     "Gemini.StreamAsync",
//         //     timeoutCts.Token);

//         // _logger.LogInformation("Gemini StreamAsync response status: {(int)response.StatusCode} {response.ReasonPhrase}", (int)response.StatusCode, response.ReasonPhrase);

//         // if (!response.IsSuccessStatusCode)
//         // {
//         //     var responseBody = await response.Content.ReadAsStringAsync(timeoutCts.Token);
//         //     _logger.LogError("Gemini StreamAsync error body:\n{Body}", responseBody);

//         //     var errorMsg = $"Gemini API returned {(int)response.StatusCode}";
//         //     if (!string.IsNullOrEmpty(responseBody))
//         //     {
//         //         try
//         //         {
//         //             using var errorDoc = JsonDocument.Parse(responseBody);
//         //             errorMsg = errorDoc.RootElement.TryGetProperty("error", out var err)
//         //                 && err.TryGetProperty("message", out var msg)
//         //                 ? msg.GetString() ?? errorMsg
//         //                 : errorMsg;
//         //         }
//         //         catch { errorMsg += $": {responseBody[..Math.Min(responseBody.Length, 200)]}"; }
//         //     }
//         //     throw new AiException(ProviderType, errorMsg, (int)response.StatusCode);
//         // }


// _logger.LogInformation(
//     "Gemini provider initialized. API key configured: {Configured}",
//     !string.IsNullOrEmpty(_settings.ApiKey));
    

// var bodyJson = JsonSerializer.Serialize(body, JsonOptions);
// _logger.LogInformation("Gemini StreamAsync request body:\n{Body}", bodyJson);

// using var response = await RetryPolicy.ExecuteWithRetryAsync(
//     async () =>
//     {
//         using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
//         {
//             Content = JsonContent.Create(body, options: JsonOptions),
//         };

//         var result = await _httpClient.SendAsync(
//             httpRequest,
//             HttpCompletionOption.ResponseHeadersRead,
//             timeoutCts.Token);

//         if (result.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
//         {
//             var retryAfter = result.Headers.RetryAfter?.Delta;

//             result.Dispose();

//             throw new AiRateLimitException(
//                 ProviderType,
//                 retryAfter);
//         }

//         return result;
//     },
//     _settings.MaxRetries,
//     _logger,
//     "Gemini.StreamAsync",
//     timeoutCts.Token);

// _logger.LogInformation(
//     "Gemini StreamAsync response status: {(int)response.StatusCode} {response.ReasonPhrase}",
//     (int)response.StatusCode,
//     response.ReasonPhrase);

// if (!response.IsSuccessStatusCode)
// {
//     var responseBody = await response.Content.ReadAsStringAsync(timeoutCts.Token);

//     _logger.LogError(
//         "Gemini StreamAsync error body:\n{Body}",
//         responseBody);

//     var errorMsg = $"Gemini API returned {(int)response.StatusCode}";

//     if (!string.IsNullOrEmpty(responseBody))
//     {
//         try
//         {
//             using var errorDoc = JsonDocument.Parse(responseBody);

//             errorMsg =
//                 errorDoc.RootElement.TryGetProperty("error", out var err)
//                 && err.TryGetProperty("message", out var msg)
//                     ? msg.GetString() ?? errorMsg
//                     : errorMsg;
//         }
//         catch
//         {
//             errorMsg += $": {responseBody[..Math.Min(responseBody.Length, 200)]}";
//         }
//     }

//     throw new AiException(
//         ProviderType,
//         errorMsg,
//         (int)response.StatusCode);
// }


//         using var stream = await response.Content.ReadAsStreamAsync(timeoutCts.Token);
//         using var reader = new StreamReader(stream);

//         while (true)
//         {
//             cancellationToken.ThrowIfCancellationRequested();

//             var line = await reader.ReadLineAsync(cancellationToken);
//             if (line is null)
//                 break;
//             if (string.IsNullOrWhiteSpace(line))
//                 continue;

//             if (line.StartsWith("data: "))
//             {
//                 var data = line[6..];
//                 if (data == "[DONE]")
//                     yield break;

//                 using var doc = JsonDocument.Parse(data);
//                 var root = doc.RootElement;

//                 if (root.TryGetProperty("error", out var errEl))
//                 {
//                     var errMsg = errEl.TryGetProperty("message", out var msgEl)
//                         ? msgEl.GetString() ?? "Unknown Gemini error"
//                         : "Unknown Gemini error";
//                     throw new AiException(ProviderType, errMsg);
//                 }

//                 if (root.TryGetProperty("candidates", out var candidates) &&
//                     candidates.GetArrayLength() > 0)
//                 {
//                     var candidate = candidates[0];
//                     var content = candidate.TryGetProperty("content", out var c) ? c : default;
//                     var parts = content.TryGetProperty("parts", out var p) ? p : default;
//                     var text = parts.GetArrayLength() > 0 && parts[0].TryGetProperty("text", out var t)
//                         ? t.GetString() ?? string.Empty
//                         : string.Empty;
//                     var finishReason = candidate.TryGetProperty("finishReason", out var fr)
//                         ? fr.GetString()
//                         : null;

//                     yield return new AIStreamChunk
//                     {
//                         Content = text,
//                         FinishReason = finishReason,
//                     };
//                 }
//             }
//         }
//     }

//     private object BuildRequestBody(AIRequest request)
//     {
//         var contents = new List<object>();
//         string? systemInstruction = string.IsNullOrEmpty(request.SystemPrompt) ? null : request.SystemPrompt;

//         foreach (var msg in request.Messages)
//         {
//             if (msg.Role == "system")
//             {
//                 systemInstruction ??= msg.Content;
//                 continue;
//             }
//             contents.Add(new
//             {
//                 role = msg.Role == "assistant" ? "model" : msg.Role,
//                 parts = new[] { new { text = msg.Content } },
//             });
//         }

//         return new
//         {
//             system_instruction = systemInstruction is null
//                 ? null
//                 : new { parts = new[] { new { text = systemInstruction } } },
//             contents,
//             generationConfig = new
//             {
//                 temperature = request.Options?.Temperature ?? 0.7,
//                 maxOutputTokens = request.Options?.MaxTokens ?? 2048,
//                 topP = request.Options?.TopP,
//             },
//         };
//     }

//     private sealed class GeminiResponse
//     {
//         public List<GeminiCandidate>? Candidates { get; set; }
//         public GeminiUsage? UsageMetadata { get; set; }
//     }

//     private sealed class GeminiCandidate
//     {
//         public GeminiContent? Content { get; set; }
//         public string? FinishReason { get; set; }
//     }

//     private sealed class GeminiContent
//     {
//         public List<GeminiPart>? Parts { get; set; }
//     }

//     private sealed class GeminiPart
//     {
//         public string Text { get; set; } = string.Empty;
//     }

//     private sealed class GeminiUsage
//     {
//         public int PromptTokenCount { get; set; }
//         public int CandidatesTokenCount { get; set; }
//         public int TotalTokenCount { get; set; }
//     }
// }


using System.Net;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TechGalaxySolutions.ResearchHub.Application.Configuration;
using TechGalaxySolutions.ResearchHub.Application.DTOs.AI;
using TechGalaxySolutions.ResearchHub.Application.Exceptions;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.AI;

public class GeminiProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly AIProviderSettings _settings;
    private readonly ILogger<GeminiProvider> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    public GeminiProvider(
        IHttpClientFactory httpClientFactory,
        AISettings aiSettings,
        ILogger<GeminiProvider> logger)
    {
        _settings = aiSettings.Providers.GetValueOrDefault("Gemini")
            ?? throw new InvalidOperationException(
                "Gemini provider settings not found");

        _logger = logger;

        // Never log the API key, its length, or its characters.
        _logger.LogInformation(
            "Gemini provider initialized. API key configured: {Configured}",
            !string.IsNullOrEmpty(_settings.ApiKey));

        _httpClient =
            httpClientFactory.CreateClient(nameof(GeminiProvider));

        _httpClient.Timeout =
            TimeSpan.FromSeconds(_settings.TimeoutSeconds);

        _httpClient.BaseAddress =
            new Uri(_settings.Endpoint.TrimEnd('/') + "/");
    }

    public AIProviderType ProviderType => AIProviderType.Gemini;

    public bool IsEnabled =>
        !string.IsNullOrEmpty(_settings.ApiKey);

    // ============================================================
    // SEND ASYNC - NON STREAMING
    // ============================================================

    public async Task<AIResponse> SendAsync(
        AIRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!IsEnabled)
        {
            throw new AiException(
                ProviderType,
                "Gemini provider is not configured (missing API key)");
        }

        var body = BuildRequestBody(request);
        var models = GetConfiguredModels();

        if (models.Count == 0)
        {
            throw new AiException(
                ProviderType,
                "No Gemini model is configured.");
        }

        AiException? last503Exception = null;

        for (var modelIndex = 0;
             modelIndex < models.Count;
             modelIndex++)
        {
            var model = models[modelIndex];

            _logger.LogInformation(
                "Gemini model selected for SendAsync: {Model} ({Current}/{Total})",
                model,
                modelIndex + 1,
                models.Count);

            try
            {
                return await SendWithModelAsync(
                    body,
                    model,
                    cancellationToken);
            }
            catch (AiException ex)
                when (
                    ex.HttpStatusCode == 503 &&
                    modelIndex < models.Count - 1)
            {
                last503Exception = ex;

                _logger.LogWarning(
                    "Gemini model {Model} returned HTTP 503. " +
                    "Trying fallback model {FallbackModel}.",
                    model,
                    models[modelIndex + 1]);
            }
        }

        if (last503Exception is not null)
        {
            throw last503Exception;
        }

        throw new AiException(
            ProviderType,
            "Gemini request failed for all configured models.");
    }

    // ============================================================
    // SEND WITH MODEL
    // ============================================================

    private async Task<AIResponse> SendWithModelAsync(
        object body,
        string model,
        CancellationToken cancellationToken)
    {
        var url =
            $"models/{model}:generateContent?key={_settings.ApiKey}";

        var timeout =
            TimeSpan.FromSeconds(_settings.TimeoutSeconds);

        using var timeoutCts =
            CancellationTokenSource.CreateLinkedTokenSource(
                cancellationToken);

        timeoutCts.CancelAfter(timeout);

        return await RetryPolicy.ExecuteWithRetryAsync(
            async () =>
            {
                _logger.LogInformation(
                    "Gemini SendAsync -> POST models/{Model}:generateContent",
                    model);

                using var response =
                    await _httpClient.PostAsJsonAsync(
                        url,
                        body,
                        JsonOptions,
                        timeoutCts.Token);

                _logger.LogInformation(
                    "Gemini SendAsync response status: {StatusCode} {ReasonPhrase}",
                    (int)response.StatusCode,
                    response.ReasonPhrase);

                var responseBody =
                    await response.Content.ReadAsStringAsync(
                        timeoutCts.Token);

                // ------------------------------------------------
                // 429 - RATE LIMIT / QUOTA
                // ------------------------------------------------

                if (response.StatusCode ==
                    HttpStatusCode.TooManyRequests)
                {
                    var retryAfter =
                        response.Headers.RetryAfter?.Delta;

                    if (IsDailyQuotaExceeded(responseBody))
                    {
                        throw new AiException(
                            ProviderType,
                            "Gemini daily free-tier quota has been exhausted. " +
                            "Please wait for the quota to reset or check " +
                            "your Google AI Studio plan/billing.",
                            (int)response.StatusCode);
                    }

                    throw new AiRateLimitException(
                        ProviderType,
                        retryAfter);
                }

                // ------------------------------------------------
                // OTHER NON SUCCESS
                // ------------------------------------------------

                if (!response.IsSuccessStatusCode)
                {
                    throw CreateGeminiHttpException(
                        response.StatusCode,
                        responseBody);
                }

                // ------------------------------------------------
                // SUCCESS
                // ------------------------------------------------

                var json =
                    JsonSerializer.Deserialize<GeminiResponse>(
                        responseBody,
                        JsonOptions);

                if (json?.Candidates is null ||
                    json.Candidates.Count == 0)
                {
                    throw new AiException(
                        ProviderType,
                        "Empty response from Gemini");
                }

                var candidate =
                    json.Candidates[0];

                var text =
                    candidate.Content?.Parts?
                        .FirstOrDefault()?.Text
                    ?? string.Empty;

                return new AIResponse
                {
                    Content = text,
                    Model = model,

                    Usage = json.UsageMetadata is null
                        ? null
                        : new AIUsage
                        {
                            PromptTokens =
                                json.UsageMetadata.PromptTokenCount,

                            CompletionTokens =
                                json.UsageMetadata.CandidatesTokenCount,

                            TotalTokens =
                                json.UsageMetadata.TotalTokenCount,
                        },

                    FinishReason =
                        candidate.FinishReason,
                };
            },
            _settings.MaxRetries,
            _logger,
            $"Gemini.SendAsync[{model}]",
            timeoutCts.Token);
    }

    // ============================================================
    // STREAM ASYNC
    // ============================================================

   public async IAsyncEnumerable<AIStreamChunk> StreamAsync(
    AIRequest request,
    [EnumeratorCancellation]
    CancellationToken cancellationToken = default)
{
    if (!IsEnabled)
    {
        throw new AiException(
            ProviderType,
            "Gemini provider is not configured (missing API key)");
    }

    var body = BuildRequestBody(request);
    var models = GetConfiguredModels();

    if (models.Count == 0)
    {
        throw new AiException(
            ProviderType,
            "No Gemini model is configured.");
    }

    // ------------------------------------------------------------
    // IMPORTANT:
    // C# does not allow yield return inside try/catch.
    // Therefore fallback handling is delegated to a separate
    // non-iterator helper.
    // ------------------------------------------------------------

    var chunks = await StreamWithFallbackAsync(
        body,
        models,
        cancellationToken);

    foreach (var chunk in chunks)
    {
        yield return chunk;
    }
}


private async Task<List<AIStreamChunk>> StreamWithFallbackAsync(
    object body,
    List<string> models,
    CancellationToken cancellationToken)
{
    AiException? last503Exception = null;

    for (var modelIndex = 0;
         modelIndex < models.Count;
         modelIndex++)
    {
        var model = models[modelIndex];

        _logger.LogInformation(
            "Gemini model selected for StreamAsync: {Model} ({Current}/{Total})",
            model,
            modelIndex + 1,
            models.Count);

        try
        {
            var chunks = new List<AIStreamChunk>();

            await foreach (
                var chunk in StreamWithModelAsync(
                    body,
                    model,
                    cancellationToken))
            {
                chunks.Add(chunk);
            }

            // Streaming completed successfully.
            return chunks;
        }
        catch (AiException ex)
            when (
                ex.HttpStatusCode == 503 &&
                modelIndex < models.Count - 1)
        {
            last503Exception = ex;

            _logger.LogWarning(
                "Gemini streaming model {Model} returned HTTP 503. " +
                "Trying fallback model {FallbackModel}.",
                model,
                models[modelIndex + 1]);
        }
    }

    if (last503Exception is not null)
    {
        throw last503Exception;
    }

    throw new AiException(
        ProviderType,
        "Gemini streaming request failed for all configured models.");
}

    // ============================================================
    // STREAM WITH SPECIFIC MODEL
    // ============================================================

    private async IAsyncEnumerable<AIStreamChunk> StreamWithModelAsync(
        object body,
        string model,
        [EnumeratorCancellation]
        CancellationToken cancellationToken)
    {
        var endpoint =
            $"models/{model}:streamGenerateContent?alt=sse&key={_settings.ApiKey}";

        _logger.LogInformation(
            "Gemini StreamAsync -> POST models/{Model}:streamGenerateContent",
            model);

        var timeout =
            TimeSpan.FromSeconds(_settings.TimeoutSeconds);

        using var timeoutCts =
            CancellationTokenSource.CreateLinkedTokenSource(
                cancellationToken);

        timeoutCts.CancelAfter(timeout);

        using var response =
            await RetryPolicy.ExecuteWithRetryAsync(
                async () =>
                {
                    var httpRequest =
                        new HttpRequestMessage(
                            HttpMethod.Post,
                            endpoint);

                    httpRequest.Content =
                        JsonContent.Create(
                            body,
                            options: JsonOptions);

                    return await _httpClient.SendAsync(
                        httpRequest,
                        HttpCompletionOption.ResponseHeadersRead,
                        timeoutCts.Token);
                },
                _settings.MaxRetries,
                _logger,
                $"Gemini.StreamAsync[{model}]",
                timeoutCts.Token);

        _logger.LogInformation(
            "Gemini StreamAsync response status: {StatusCode} {ReasonPhrase}",
            (int)response.StatusCode,
            response.ReasonPhrase);

        // --------------------------------------------------------
        // ERROR RESPONSE
        // --------------------------------------------------------

        if (!response.IsSuccessStatusCode)
        {
            var errorBody =
                await response.Content.ReadAsStringAsync(
                    timeoutCts.Token);

            _logger.LogWarning(
                "Gemini StreamAsync error body: {ErrorBody}",
                errorBody);

            var statusCode =
                response.StatusCode;

            // ----------------------------------------------------
            // 503 - SERVICE UNAVAILABLE
            // ----------------------------------------------------

            if (statusCode ==
                HttpStatusCode.ServiceUnavailable)
            {
                throw new AiException(
                    ProviderType,
                    ExtractGeminiErrorMessage(
                        errorBody,
                        "Gemini service is temporarily unavailable."),
                    (int)statusCode);
            }

            // ----------------------------------------------------
            // 429 - RATE LIMIT / QUOTA
            // ----------------------------------------------------

            if (statusCode ==
                HttpStatusCode.TooManyRequests)
            {
                var retryAfter =
                    response.Headers.RetryAfter?.Delta;

                if (IsDailyQuotaExceeded(errorBody))
                {
                    throw new AiException(
                        ProviderType,
                        "Gemini daily free-tier quota has been exhausted. " +
                        "Please wait for the quota to reset or check " +
                        "your Google AI Studio plan/billing.",
                        (int)statusCode);
                }

                throw new AiRateLimitException(
                    ProviderType,
                    retryAfter);
            }

            // ----------------------------------------------------
            // OTHER ERRORS
            // ----------------------------------------------------

            throw CreateGeminiHttpException(
                statusCode,
                errorBody);
        }

        // --------------------------------------------------------
        // READ STREAM
        // --------------------------------------------------------

        await using var stream =
            await response.Content.ReadAsStreamAsync(
                timeoutCts.Token);

        using var reader =
            new StreamReader(stream);

        while (true)
        {
            timeoutCts.Token.ThrowIfCancellationRequested();

            var line =
                await reader.ReadLineAsync(
                    timeoutCts.Token);

            if (line is null)
            {
                break;
            }

            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            if (!line.StartsWith(
                    "data:",
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var json =
                line["data:".Length..].Trim();

            if (string.IsNullOrWhiteSpace(json))
            {
                continue;
            }

            if (json == "[DONE]")
            {
                yield break;
            }

            var chunk =
                ParseGeminiStreamChunk(json);

            if (chunk is null)
            {
                continue;
            }

            if (chunk.Candidates is null)
            {
                continue;
            }

            foreach (var candidate in chunk.Candidates)
            {
                var text =
                    candidate.Content?.Parts?
                        .FirstOrDefault()?.Text
                    ?? string.Empty;

                var finishReason =
                    candidate.FinishReason;

                if (!string.IsNullOrEmpty(text))
                {
                    yield return new AIStreamChunk
                    {
                        Content = text,
                        FinishReason = finishReason
                    };
                }
                else if (!string.IsNullOrEmpty(finishReason))
                {
                    yield return new AIStreamChunk
                    {
                        Content = string.Empty,
                        FinishReason = finishReason
                    };
                }

                if (!string.IsNullOrEmpty(finishReason))
                {
                    _logger.LogDebug(
                        "Gemini stream finished with reason: {FinishReason}",
                        finishReason);
                }
            }
        }
    }

    // ============================================================
    // PARSE STREAM CHUNK
    // ============================================================

    private GeminiResponse? ParseGeminiStreamChunk(
        string json)
    {
        try
        {
            return JsonSerializer.Deserialize<GeminiResponse>(
                json,
                JsonOptions);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to parse Gemini streaming chunk.");

            return null;
        }
    }

    // ============================================================
    // GET CONFIGURED MODELS
    // ============================================================

    private List<string> GetConfiguredModels()
    {
        var models = new List<string>();

        if (!string.IsNullOrWhiteSpace(_settings.Model))
        {
            models.Add(_settings.Model);
        }

        if (_settings.FallbackModels is not null)
        {
            models.AddRange(
                _settings.FallbackModels
                    .Where(m => !string.IsNullOrWhiteSpace(m)));
        }

        return models
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    // ============================================================
    // QUOTA DETECTION
    // ============================================================

    private static bool IsDailyQuotaExceeded(
        string responseBody)
    {
        return
            responseBody.Contains(
                "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
                StringComparison.OrdinalIgnoreCase)
            ||
            responseBody.Contains(
                "quota exceeded",
                StringComparison.OrdinalIgnoreCase)
            ||
            responseBody.Contains(
                "quota_exceeded",
                StringComparison.OrdinalIgnoreCase);
    }

    // ============================================================
    // GEMINI HTTP ERROR
    // ============================================================

    private AiException CreateGeminiHttpException(
        HttpStatusCode statusCode,
        string responseBody)
    {
        var errorMsg =
            ExtractGeminiErrorMessage(
                responseBody,
                $"Gemini API returned {(int)statusCode}");

        return new AiException(
            ProviderType,
            errorMsg,
            (int)statusCode);
    }

    // ============================================================
    // EXTRACT ERROR MESSAGE
    // ============================================================

    private static string ExtractGeminiErrorMessage(
        string responseBody,
        string defaultMessage)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return defaultMessage;
        }

        try
        {
            using var errorDoc =
                JsonDocument.Parse(responseBody);

            if (errorDoc.RootElement.TryGetProperty(
                    "error",
                    out var errorElement))
            {
                if (errorElement.TryGetProperty(
                        "message",
                        out var messageElement))
                {
                    return messageElement.GetString()
                        ?? defaultMessage;
                }
            }
        }
        catch
        {
            // Fall through and return truncated body.
        }

        return
            defaultMessage +
            ": " +
            responseBody[
                ..Math.Min(responseBody.Length, 300)];
    }

    // ============================================================
    // BUILD REQUEST BODY
    // ============================================================

    private object BuildRequestBody(
        AIRequest request)
    {
        var contents =
            new List<object>();

        string? systemInstruction =
            string.IsNullOrEmpty(request.SystemPrompt)
                ? null
                : request.SystemPrompt;

        foreach (var msg in request.Messages)
        {
            if (msg.Role == "system")
            {
                systemInstruction ??=
                    msg.Content;

                continue;
            }

            contents.Add(
                new
                {
                    role =
                        msg.Role == "assistant"
                            ? "model"
                            : msg.Role,

                    parts =
                        new[]
                        {
                            new
                            {
                                text = msg.Content
                            }
                        },
                });
        }

        return new
        {
            system_instruction =
                systemInstruction is null
                    ? null
                    : new
                    {
                        parts =
                            new[]
                            {
                                new
                                {
                                    text =
                                        systemInstruction
                                }
                            }
                    },

            contents,

            generationConfig =
                new
                {
                    temperature =
                        request.Options?.Temperature
                        ?? 0.7,

                    maxOutputTokens =
                        request.Options?.MaxTokens
                        ?? 2048,

                    topP =
                        request.Options?.TopP,
                },
        };
    }

    // ============================================================
    // GEMINI RESPONSE MODELS
    // ============================================================

    private sealed class GeminiResponse
    {
        public List<GeminiCandidate>? Candidates
        {
            get;
            set;
        }

        public GeminiUsage? UsageMetadata
        {
            get;
            set;
        }
    }

    private sealed class GeminiCandidate
    {
        public GeminiContent? Content
        {
            get;
            set;
        }

        public string? FinishReason
        {
            get;
            set;
        }
    }

    private sealed class GeminiContent
    {
        public List<GeminiPart>? Parts
        {
            get;
            set;
        }
    }

    private sealed class GeminiPart
    {
        public string Text
        {
            get;
            set;
        } = string.Empty;
    }

    private sealed class GeminiUsage
    {
        public int PromptTokenCount
        {
            get;
            set;
        }

        public int CandidatesTokenCount
        {
            get;
            set;
        }

        public int TotalTokenCount
        {
            get;
            set;
        }
    }
}