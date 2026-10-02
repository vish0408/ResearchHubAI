using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string subDirectory);
    Task<string> SaveFileAsync(byte[] content, string fileName, string subDirectory);
    Task<byte[]?> ReadFileAsync(string filePath);
    Task DeleteFileAsync(string filePath);
    string GetContentType(string fileName);
    string GenerateStoredFileName(string originalFileName);
}

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly ILogger<FileStorageService> _logger;

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        _basePath = configuration.GetValue<string>("FileStorage:Path")
            ?? Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        _logger = logger;

        if (!Directory.Exists(_basePath))
        {
            Directory.CreateDirectory(_basePath);
            _logger.LogInformation("Created file storage directory: {Path}", _basePath);
        }
    }

    public async Task<string> SaveFileAsync(IFormFile file, string subDirectory)
    {
        var dir = Path.Combine(_basePath, subDirectory);
        if (!Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        var storedName = GenerateStoredFileName(file.FileName);
        var fullPath = Path.Combine(dir, storedName);

        await using var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write);
        await file.CopyToAsync(stream);

        var relativePath = Path.Combine(subDirectory, storedName).Replace('\\', '/');
        _logger.LogInformation("Saved file: {Path} ({Size} bytes)", fullPath, file.Length);
        return relativePath;
    }

    public async Task<string> SaveFileAsync(byte[] content, string fileName, string subDirectory)
    {
        var dir = Path.Combine(_basePath, subDirectory);
        if (!Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        var storedName = GenerateStoredFileName(fileName);
        var fullPath = Path.Combine(dir, storedName);

        await File.WriteAllBytesAsync(fullPath, content);

        var relativePath = Path.Combine(subDirectory, storedName).Replace('\\', '/');
        _logger.LogInformation("Saved file: {Path} ({Size} bytes)", fullPath, content.Length);
        return relativePath;
    }

    public async Task<byte[]?> ReadFileAsync(string filePath)
    {
       var fullPath = Path.Combine(_basePath, filePath);

_logger.LogWarning("DOWNLOAD DEBUG => BasePath: {BasePath} | FilePath: {FilePath} | FullPath: {FullPath} | Exists: {Exists}",
    _basePath, filePath, fullPath, File.Exists(fullPath));
    
        if (!File.Exists(fullPath))
        {
            _logger.LogWarning("File not found: {Path}", fullPath);
            return null;
        }

        return await File.ReadAllBytesAsync(fullPath);
    }

    public Task DeleteFileAsync(string filePath)
    {
        var fullPath = Path.Combine(_basePath, filePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            _logger.LogInformation("Deleted file: {Path}", fullPath);
        }
        return Task.CompletedTask;
    }

    public string GetContentType(string fileName)
    {
        var ext = Path.GetExtension(fileName)?.TrimStart('.').ToLowerInvariant() ?? "";
        return ext switch
        {
            "pdf" => "application/pdf",
            "doc" => "application/msword",
            "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "xls" => "application/vnd.ms-excel",
            "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "png" => "image/png",
            "jpg" or "jpeg" => "image/jpeg",
            "gif" => "image/gif",
            "svg" => "image/svg+xml",
            "txt" => "text/plain",
            "csv" => "text/csv",
            "zip" => "application/zip",
            "mp4" => "video/mp4",
            "mp3" => "audio/mpeg",
            _ => "application/octet-stream",
        };
    }

    public string GenerateStoredFileName(string originalFileName)
    {
        var ext = Path.GetExtension(originalFileName);
        var nameWithoutExt = Path.GetFileNameWithoutExtension(originalFileName);
        var safeName = SanitizeFileName(nameWithoutExt);
        var uniqueId = Guid.NewGuid().ToString("N")[..12];
        return $"{safeName}_{uniqueId}{ext}";
    }

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var sanitized = new string(name.Where(c => !invalid.Contains(c)).ToArray());
        return string.IsNullOrWhiteSpace(sanitized) ? "file" : sanitized[..Math.Min(sanitized.Length, 80)];
    }
}
