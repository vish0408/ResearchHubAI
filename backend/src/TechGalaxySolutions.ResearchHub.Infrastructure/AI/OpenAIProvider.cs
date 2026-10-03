using System.Globalization;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TechGalaxySolutions.ResearchHub.Application.Configuration;
using TechGalaxySolutions.ResearchHub.Application.DTOs.AI;
using TechGalaxySolutions.ResearchHub.Application.Exceptions;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.AI;

public class OpenAIProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly AIProviderSettings _settings;
    private readonly ILogger<OpenAIProvider> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
    };

    public OpenAIProvider(
        IHttpClientFactory httpClientFactory,
        AISettings aiSettings,
        ILogger<OpenAIProvider> logger)
    {
        _settings = aiSettings.Providers.GetValueOrDefault("OpenAI") ?? throw new InvalidOperationException("OpenAI provider settings not found");
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient(nameof(OpenAIProvider));
        _httpClient.BaseAddress = new Uri(_settings.Endpoint.TrimEnd('/') + "/");
        if (!string.IsNullOrEmpty(_settings.ApiKey))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _settings.ApiKey);
        }
    }

    public AIProviderType ProviderType => AIProviderType.OpenAI;

    public bool IsEnabled => !string.IsNullOrEmpty(_settings.ApiKey);

    public async Task<AIResponse> SendAsync(AIRequest request, CancellationToken cancellationToken = default)
    {
        if (!IsEnabled)
            throw new AiException(ProviderType, "OpenAI provider is not configured (missing API key)");

        var body = BuildRequestBody(request, stream: false);
        var timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(timeout);

        return await RetryPolicy.ExecuteWithRetryAsync(
            async () =>
            {
                using var response = await _httpClient.PostAsJsonAsync("chat/completions", body, JsonOptions, timeoutCts.Token);

               if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
{
    var errorBody = await response.Content.ReadAsStringAsync(timeoutCts.Token);

    _logger.LogError(
        "OpenAI 429 response: {ErrorBody}",
        errorBody);

    var retryAfter = response.Headers.RetryAfter?.Delta;

    throw new AiRateLimitException(ProviderType, retryAfter);
}

                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadFromJsonAsync<OpenAIResponse>(JsonOptions, timeoutCts.Token);
                if (json?.Choices is null or { Length: 0 })
                    throw new AiException(ProviderType, "Empty response from OpenAI");

                var choice = json.Choices[0];
                return new AIResponse
                {
                    Content = choice.Message?.Content ?? string.Empty,
                    Model = json.Model,
                    Usage = json.Usage is null ? null : new AIUsage
                    {
                        PromptTokens = json.Usage.PromptTokens,
                        CompletionTokens = json.Usage.CompletionTokens,
                        TotalTokens = json.Usage.TotalTokens,
                    },
                    FinishReason = choice.FinishReason,
                };
            },
            _settings.MaxRetries,
            _logger,
            "OpenAI.SendAsync",
            timeoutCts.Token);
    }

    public async IAsyncEnumerable<AIStreamChunk> StreamAsync(
        AIRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        if (!IsEnabled)
            throw new AiException(ProviderType, "OpenAI provider is not configured (missing API key)");

        var body = BuildRequestBody(request, stream: true);
        var timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(timeout);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = JsonContent.Create(body, options: JsonOptions),
        };

        using var response = await RetryPolicy.ExecuteWithRetryAsync(
            () => _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, timeoutCts.Token),
            _settings.MaxRetries,
            _logger,
            "OpenAI.StreamAsync",
            timeoutCts.Token);

        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync(timeoutCts.Token);
        using var reader = new StreamReader(stream);

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var line = await reader.ReadLineAsync(cancellationToken);
            if (line is null)
                break;
            if (string.IsNullOrWhiteSpace(line))
                continue;

            if (line.StartsWith("data: "))
            {
                var data = line[6..];
                if (data == "[DONE]")
                    yield break;

                using var doc = JsonDocument.Parse(data);
                var root = doc.RootElement;

                if (root.TryGetProperty("choices", out var choices) &&
                    choices.GetArrayLength() > 0)
                {
                    var choice = choices[0];
                    var delta = choice.TryGetProperty("delta", out var d) ? d : default;
                    var content = delta.TryGetProperty("content", out var c) ? c.GetString() ?? string.Empty : string.Empty;
                    var finishReason = choice.TryGetProperty("finish_reason", out var fr) ? fr.GetString() : null;

                    yield return new AIStreamChunk
                    {
                        Content = content,
                        FinishReason = finishReason,
                    };
                }
            }
        }
    }

    private object BuildRequestBody(AIRequest request, bool stream)
    {
        var messages = new List<object>();

        if (!string.IsNullOrEmpty(request.SystemPrompt))
        {
            messages.Add(new { role = "system", content = request.SystemPrompt });
        }

        foreach (var msg in request.Messages)
        {
            messages.Add(new { role = msg.Role, content = msg.Content });
        }

        return new
        {
            model = _settings.Model,
            messages,
            stream,
            temperature = request.Options?.Temperature ?? 0.7,
            max_tokens = request.Options?.MaxTokens ?? 2048,
            top_p = request.Options?.TopP,
            frequency_penalty = request.Options?.FrequencyPenalty,
            presence_penalty = request.Options?.PresencePenalty,
        };
    }

    private sealed class OpenAIResponse
    {
        public OpenAIChoice[]? Choices { get; set; }
        public OpenAIUsage? Usage { get; set; }
        public string? Model { get; set; }
    }

    private sealed class OpenAIChoice
    {
        public OpenAIMessage? Message { get; set; }
        public string? FinishReason { get; set; }
    }

    private sealed class OpenAIMessage
    {
        public string? Content { get; set; }
    }

    private sealed class OpenAIUsage
    {
        public int PromptTokens { get; set; }
        public int CompletionTokens { get; set; }
        public int TotalTokens { get; set; }
    }
}
