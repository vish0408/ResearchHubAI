using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using TechGalaxySolutions.ResearchHub.Api.Middlewares;
using TechGalaxySolutions.ResearchHub.Application;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Infrastructure;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ResearchHub AI API",
        Version = "v1",
        Description = "ResearchHub AI Backend API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });

options.AddSecurityRequirement(document =>
    new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

// CORS
var frontendBaseUrl = builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(frontendBaseUrl.TrimEnd('/'))
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
        )
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Validate SMTP configuration in Development mode
if (app.Environment.IsDevelopment())
{
    var smtpSection = app.Configuration.GetSection("Smtp");
    var host = smtpSection["Host"];
    var port = smtpSection["Port"];
    var username = smtpSection["Username"];
    var password = smtpSection["Password"];
    var fromEmail = smtpSection["FromEmail"];
    var fromName = smtpSection["FromName"];
    var useSsl = smtpSection["UseSsl"];

    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("=== SMTP Configuration ===");
    logger.LogInformation("Host: {Host}", host);
    logger.LogInformation("Port: {Port}", port);
    logger.LogInformation("Username: {Username}", username);
    logger.LogInformation("FromEmail: {FromEmail}", fromEmail);
    logger.LogInformation("FromName: {FromName}", fromName);
    logger.LogInformation("UseSsl: {UseSsl}", useSsl);
    logger.LogInformation("Password: [REDACTED]");
    logger.LogInformation("===========================");

    var placeholders = new[] { "SET_VIA_USER_SECRETS_OR_ENVIRONMENT_VARIABLES", "YOUR_EMAIL", "YOUR_PASSWORD", "smtp.example.com", "" };
    var missing = new List<string>();

    if (placeholders.Contains(host, StringComparer.OrdinalIgnoreCase))
        missing.Add("Smtp:Host");
    if (placeholders.Contains(fromEmail, StringComparer.OrdinalIgnoreCase))
        missing.Add("Smtp:FromEmail");

    if (missing.Count > 0)
    {
        var msg = $"SMTP configuration is incomplete. Missing or placeholder values for: {string.Join(", ", missing)}. Set them via:\n" +
          $"  dotnet user-secrets set \"Smtp:Host\" \"smtp.gmail.com\"\n" +
          $"  dotnet user-secrets set \"Smtp:Port\" \"587\"\n" +
          $"  dotnet user-secrets set \"Smtp:Username\" \"sowmiyatgs@gmail.com\"\n" +
          $"  dotnet user-secrets set \"Smtp:Password\" \"CTO@2026\"\n" +
          $"  dotnet user-secrets set \"Smtp:FromEmail\" \"sowmiyatgs@gmail.com\"";
        logger.LogError("SMTP validation failed: {Message}", msg);
        throw new InvalidOperationException(msg);
    }

    if (!string.IsNullOrEmpty(username) && placeholders.Contains(username, StringComparer.OrdinalIgnoreCase))
        logger.LogWarning("Smtp:Username is set to a placeholder value. SMTP authentication will be skipped.");
    if (!string.IsNullOrEmpty(password) && placeholders.Contains(password, StringComparer.OrdinalIgnoreCase))
        logger.LogWarning("Smtp:Password is set to a placeholder value. SMTP authentication will be skipped.");

    logger.LogInformation("SMTP configuration is valid.");

    logger.LogInformation("=== Frontend Configuration ===");
    logger.LogInformation("BaseUrl: {BaseUrl}", frontendBaseUrl);
    logger.LogInformation("==============================");
}

if (string.IsNullOrEmpty(frontendBaseUrl))
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError("Frontend:BaseUrl configuration is missing or empty. Set it via appsettings.json or user secrets.");
    throw new InvalidOperationException("Frontend:BaseUrl configuration is missing or empty.");
}

// Exception handling
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DbInitializer.SeedAsync(context);
    await scope.ServiceProvider.GetRequiredService<IResearchCategoryService>().EnsureProvisionedAsync();
}

app.Run();

    