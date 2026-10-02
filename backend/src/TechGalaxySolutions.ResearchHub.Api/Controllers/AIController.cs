using System.Diagnostics;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechGalaxySolutions.ResearchHub.Application.DTOs.AI;
using TechGalaxySolutions.ResearchHub.Application.Exceptions;
using TechGalaxySolutions.ResearchHub.Infrastructure.AI;

namespace TechGalaxySolutions.ResearchHub.Api.Controllers;

[ApiController]
[Route("ai")]
[Authorize(Roles = "CollegeAdmin,SuperAdmin")]
public class AIController : ControllerBase
{
    private readonly AIProviderFactory _providerFactory;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public AIController(AIProviderFactory providerFactory)
    {
        _providerFactory = providerFactory;
    }

    [HttpGet("providers")]
    public IActionResult GetProviders()
    {
        var providers = _providerFactory.GetAllProviders().Select(p => new AIProviderInfo
        {
            Name = p.ProviderType.ToString(),
            Model = p.IsEnabled ? GetModelName(p.ProviderType) : string.Empty,
            IsEnabled = p.IsEnabled,
        });

        return Ok(providers);
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] AIRequest request, [FromQuery] string? provider = null)
    {
        var aiProvider = string.IsNullOrEmpty(provider)
            ? _providerFactory.GetDefaultProvider()
            : _providerFactory.GetProvider(provider);

        var sw = Stopwatch.StartNew();
        var response = await aiProvider.SendAsync(request);
        sw.Stop();

        var chatResponse = new AIChatResponse
        {
            Content = response.Content,
            Model = response.Model,
            Usage = response.Usage,
            FinishReason = response.FinishReason,
            ResponseTimeMs = sw.ElapsedMilliseconds,
            Provider = aiProvider.ProviderType.ToString(),
        };

        return Ok(chatResponse);
    }

    [HttpPost("stream")]
    public async Task Stream([FromBody] AIRequest request, [FromQuery] string? provider = null)
    {
        var aiProvider = string.IsNullOrEmpty(provider)
            ? _providerFactory.GetDefaultProvider()
            : _providerFactory.GetProvider(provider);

        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        try
        {
            await foreach (var chunk in aiProvider.StreamAsync(request, HttpContext.RequestAborted))
            {
                var json = JsonSerializer.Serialize(chunk, JsonOptions);
                await Response.WriteAsync($"data: {json}\n\n", HttpContext.RequestAborted);
                await Response.Body.FlushAsync(HttpContext.RequestAborted);
            }
        }
        catch (OperationCanceledException)
        {
            // Client disconnected - normal
        }
        catch (AiRateLimitException ex)
        {
            var error = JsonSerializer.Serialize(new { error = ex.Message, retryAfter = ex.RetryAfter?.TotalSeconds }, JsonOptions);
            await Response.WriteAsync($"data: {error}\n\n", HttpContext.RequestAborted);
        }
        catch (AiTimeoutException ex)
        {
            var error = JsonSerializer.Serialize(new { error = ex.Message }, JsonOptions);
            await Response.WriteAsync($"data: {error}\n\n", HttpContext.RequestAborted);
        }
        catch (AiException ex)
        {
            var error = JsonSerializer.Serialize(new { error = ex.Message }, JsonOptions);
            await Response.WriteAsync($"data: {error}\n\n", HttpContext.RequestAborted);
        }

        await Response.WriteAsync("data: [DONE]\n\n", HttpContext.RequestAborted);
        await Response.Body.FlushAsync(HttpContext.RequestAborted);
    }

    private static string GetModelName(AIProviderType type) => type switch
    {
        AIProviderType.OpenAI => "gpt-4o",
        AIProviderType.Anthropic => "claude-3-opus-20240229",
        AIProviderType.Gemini => "gemini-3.6-flash",
        _ => "unknown",
    };
}

