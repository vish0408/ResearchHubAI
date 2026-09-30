using Microsoft.AspNetCore.Http;

namespace TechGalaxySolutions.ResearchHub.Application.DTOs.Chapter;

public class CreateChapterRequest
{
    public string Title { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public int Order { get; set; }

    public IFormFile? File { get; set; }
}