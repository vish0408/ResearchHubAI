using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TechGalaxySolutions.ResearchHub.Application.Exceptions;

namespace TechGalaxySolutions.ResearchHub.Api.Middlewares;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Request.EnableBuffering();

        try
        {
            await _next(context);
        }
        catch (FluentValidation.ValidationException ex)
        {
            await LogExceptionAsync(context, ex);
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";
            var errors = ex.Errors.Select(e => new
            {
                field = e.PropertyName,
                message = e.ErrorMessage
            });
            var response = new
            {
                error = new
                {
                    title = "Validation Failed",
                    status = context.Response.StatusCode,
                    errors
                }
            };
            var json = JsonSerializer.Serialize(response, _jsonOptions);
            await context.Response.WriteAsync(json);
        }
        catch (AiRateLimitException ex)
        {
            await LogExceptionAsync(context, ex);
            context.Response.StatusCode = 429;
            context.Response.ContentType = "application/json";
            await WriteErrorAsync(context, "Rate Limit Exceeded", "Too many requests. Please try again later.");
        }
        catch (AiTimeoutException ex)
        {
            await LogExceptionAsync(context, ex);
            context.Response.StatusCode = 504;
            context.Response.ContentType = "application/json";
            await WriteErrorAsync(context, "Gateway Timeout", "The AI service request timed out. Please try again.");
        }
       catch (AiException ex)
{
    await LogExceptionAsync(context, ex);

    context.Response.StatusCode = ex.HttpStatusCode ?? 502;
    context.Response.ContentType = "application/json";

    var isQuotaExceeded =
        context.Response.StatusCode == 429 &&
        ex.Message.Contains("daily free-tier quota", StringComparison.OrdinalIgnoreCase);

    if (isQuotaExceeded)
    {
        await WriteErrorAsync(
            context,
            "AI Quota Exceeded",
            ex.Message);
    }
    else
    {
        await WriteErrorAsync(
            context,
            "AI Service Error",
            "An error occurred while processing your request through the AI service.");
    }
}
        catch (ConflictException ex)
        {
            await LogExceptionAsync(context, ex);
            context.Response.StatusCode = (int)HttpStatusCode.Conflict;
            context.Response.ContentType = "application/json";
            await WriteErrorAsync(context, "Conflict", ex.Message);
        }
        catch (ForbiddenException ex)
        {
            await LogExceptionAsync(context, ex);
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
            context.Response.ContentType = "application/json";
            await WriteErrorAsync(context, "Forbidden", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            await LogExceptionAsync(context, ex);
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            context.Response.ContentType = "application/json";
            await WriteErrorAsync(context, "Authentication Failed", "Invalid email, password, or account is deactivated.");
        }
        catch (KeyNotFoundException ex)
        {
            await LogExceptionAsync(context, ex);
            context.Response.StatusCode = (int)HttpStatusCode.NotFound;
            context.Response.ContentType = "application/json";
            await WriteErrorAsync(context, "Not Found", "The requested resource was not found.");
        }
        catch (InvalidOperationException ex)
        {
            await LogExceptionAsync(context, ex);
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";
            await WriteErrorAsync(context, "Bad Request", ex.Message);
        }
        catch (Exception ex)
        {
            await LogExceptionAsync(context, ex);
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            await WriteErrorAsync(context, "Internal Server Error", "An unexpected error occurred. Please try again later.");
        }
    }

    private async Task LogExceptionAsync(HttpContext context, Exception ex)
    {
        var controller = context.Request.RouteValues["controller"]?.ToString() ?? "Unknown";
        var action = context.Request.RouteValues["action"]?.ToString() ?? "Unknown";
        var route = $"{context.Request.Method} {context.Request.Path}{context.Request.QueryString}";

        string body = "Not readable";
        try
        {
            if (context.Request.Body.CanSeek)
            {
                context.Request.Body.Position = 0;
                using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
                var rawBody = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;
                body = MaskPasswords(rawBody);
            }
        }
        catch
        {
            body = "Read error";
        }

        var logMessage = $"Exception Type: {ex.GetType().FullName} | " +
                         $"Message: {ex.Message} | " +
                         $"Inner Exception: {ex.InnerException?.ToString() ?? "None"} | " +
                         $"Stack Trace: {ex.StackTrace ?? "Not available"} | " +
                         $"Source: {ex.Source} | " +
                         $"TargetSite: {ex.TargetSite} | " +
                         $"Controller: {controller} | " +
                         $"Action: {action} | " +
                         $"Route: {route} | " +
                         $"Body: {body}";

        _logger.LogError(ex, "[EXCEPTION-MIDDLEWARE] Exception caught: {LogMessage}", logMessage);
    }

    private static string MaskPasswords(string body)
    {
        if (string.IsNullOrEmpty(body))
            return body;

        body = Regex.Replace(body,
            "\"(password|currentPassword|newPassword|confirmPassword|secret|apiKey|token)\"\\s*:\\s*\"[^\"]*\"",
            "\"$1\":\"***MASKED***\"",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        return body;
    }

    private static async Task WriteErrorAsync(HttpContext context, string title, string detail)
    {
        var response = new
        {
            error = new
            {
                title,
                detail,
                status = context.Response.StatusCode,
                traceId = context.TraceIdentifier
            }
        };

        var json = JsonSerializer.Serialize(response, _jsonOptions);
        await context.Response.WriteAsync(json);
    }
}
