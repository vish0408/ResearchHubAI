namespace TechGalaxySolutions.ResearchHub.Application.Configuration;

public class AISettings
{
    public Dictionary<string, AIProviderSettings> Providers { get; set; } = new();

    public string DefaultProvider { get; set; } = "OpenAI";

    public int MaxRetries { get; set; } = 3;

    public int TimeoutSeconds { get; set; } = 30;
}

public class AIProviderSettings
{
    public string Endpoint { get; set; } = string.Empty;

    public string Model { get; set; } = string.Empty;

    public List<string> FallbackModels { get; set; } = new();

    public string ApiKey { get; set; } = string.Empty;

    public int MaxRetries { get; set; } = 3;

    public int TimeoutSeconds { get; set; } = 30;
}