using Microsoft.AspNetCore.Http;

namespace TechGalaxySolutions.ResearchHub.Application.DTOs.Chapter;

public class CreateChapterVersionRequest
{
    public IFormFile? File { get; set; }
}