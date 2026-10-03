using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TechGalaxySolutions.ResearchHub.Application.Configuration;
using TechGalaxySolutions.ResearchHub.Application.DTOs.Auth;
using TechGalaxySolutions.ResearchHub.Application.Interfaces;
using TechGalaxySolutions.ResearchHub.Domain.Entities;
using TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IMapper _mapper;
    private readonly IEmailService _emailService;
    private readonly IAuditLogService _auditLogService;
    private readonly FrontendSettings _frontend;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        ApplicationDbContext context,
        ITokenService tokenService,
        IMapper mapper,
        IEmailService emailService,
        IAuditLogService auditLogService,
        IOptions<FrontendSettings> frontend,
        ILogger<AuthService> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _mapper = mapper;
        _emailService = emailService;
        _auditLogService = auditLogService;
        _frontend = frontend.Value;
        _logger = logger;
    }

    public async Task<TokenResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        if (user.Status == "Locked")
        {
            throw new UnauthorizedAccessException("Your account has been locked.");
        }

        if (user.Status == "Disabled")
        {
            throw new UnauthorizedAccessException("Your account has been disabled.");
        }

        if (user.Status == "InvitationSent" || user.Status == "Draft")
        {
            throw new UnauthorizedAccessException("Please activate your account from your email.");
        }

        if (user.Status != "Active" && user.Status != "EmailVerified")
        {
            throw new UnauthorizedAccessException("Account is not active. Please contact support.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(user.Id, "Login", "User", user.Id.ToString(), null, user.FullName);

        return await GenerateTokenResponseAsync(user);
    }

    public async Task<ValidateActivationTokenResult> ValidateActivationTokenAsync(string token)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.ActivationToken == token && !u.IsDeleted);

        if (user == null)
        {
            return new ValidateActivationTokenResult { Valid = false };
        }

        if (user.Status == "Active")
        {
            return new ValidateActivationTokenResult { Valid = false, Used = true, FullName = user.FullName, Email = user.Email, UserId = user.Id };
        }

        if (user.ActivationExpiry.HasValue && user.ActivationExpiry.Value < DateTime.UtcNow)
        {
            return new ValidateActivationTokenResult { Valid = false, Expired = true, FullName = user.FullName, Email = user.Email, UserId = user.Id };
        }

        return new ValidateActivationTokenResult { Valid = true, FullName = user.FullName, Email = user.Email, UserId = user.Id };
    }

    public async Task ResendActivationByTokenAsync(string token)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.ActivationToken == token && !u.IsDeleted)
            ?? throw new KeyNotFoundException("User not found");

        if (user.Status != "Draft" && user.Status != "InvitationSent")
        {
            throw new InvalidOperationException("Account is already active. Cannot resend invitation.");
        }

        var temporaryPassword = GenerateRandomPassword();
        var activationToken = Guid.NewGuid().ToString();

        user.TemporaryPasswordHash = BCrypt.Net.BCrypt.HashPassword(temporaryPassword);
        user.TemporaryPasswordExpiresAt = DateTime.UtcNow.AddHours(72);
        user.ActivationToken = activationToken;
        user.ActivationExpiry = DateTime.UtcNow.AddHours(24);
        user.InvitationSentAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Resending invitation email to {Recipient}...", user.Email);

        try
        {
            await _emailService.SendWelcomeEmailAsync(user.Email, user.FullName, temporaryPassword, activationToken);
            user.Status = "InvitationSent";
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend invitation email to {Email}", user.Email);
            throw new InvalidOperationException($"Invitation email failed: {ex.Message}", ex);
        }

        await _auditLogService.LogAsync(user.Id, "Invitation Resent", "User", user.Id.ToString(), "", user.FullName);
        _logger.LogInformation("Invitation resent to {Email}", user.Email);
    }

    public async Task ActivateAccountAsync(ActivateAccountRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.ActivationToken == request.Token && !u.IsDeleted);

        if (user == null)
        {
            throw new InvalidOperationException("Invalid activation token.");
        }

        if (user.ActivationExpiry.HasValue && user.ActivationExpiry.Value < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Activation token has expired. Please request a new invitation.");
        }

        if (user.Status == "Active")
        {
            throw new InvalidOperationException("Account is already activated.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        user.ActivationToken = null;
        user.ActivationExpiry = null;
        user.TemporaryPasswordHash = null;
        user.TemporaryPasswordExpiresAt = null;
        user.EmailVerified = true;
        user.Status = "Active";
        user.IsActive = true;
        user.ActivatedAt = DateTime.UtcNow;
        user.IsFirstLogin = false;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(user.Id, "Account Activated", "User", user.Id.ToString(), "", user.FullName);
        _logger.LogInformation("Account activated for user {Email}", user.Email);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);

        if (user == null)
        {
            return;
        }

        var token = Guid.NewGuid().ToString();
        user.PasswordResetToken = token;
        user.PasswordResetExpiresAt = DateTime.UtcNow.AddMinutes(30);
        await _context.SaveChangesAsync();

        var baseUrl = _frontend.BaseUrl.TrimEnd('/');
        var resetLink = $"{baseUrl}/reset-password?token={token}&email={user.Email}";
        await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, resetLink);

        await _auditLogService.LogAsync(user.Id, "Password Reset Requested", "User", user.Id.ToString(), "", user.FullName);
        _logger.LogInformation("Password reset email sent to {Email}", user.Email);
    }

    public async Task<ValidatePasswordResetTokenResult> ValidatePasswordResetTokenAsync(string token)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.PasswordResetToken == token && !u.IsDeleted);

        if (user == null)
        {
            var usedUser = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.PasswordChangedAt != null && !u.IsDeleted);

            return new ValidatePasswordResetTokenResult { Valid = false };
        }

        if (user.PasswordResetExpiresAt.HasValue && user.PasswordResetExpiresAt.Value < DateTime.UtcNow)
            return new ValidatePasswordResetTokenResult { Valid = false, Expired = true, FullName = user.FullName, Email = user.Email, UserId = user.Id };

        return new ValidatePasswordResetTokenResult { Valid = true, FullName = user.FullName, Email = user.Email, UserId = user.Id };
    }

    public async Task ResendPasswordResetByTokenAsync(string token)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.PasswordResetToken == token && !u.IsDeleted)
            ?? throw new KeyNotFoundException("User not found");

        var newToken = Guid.NewGuid().ToString();
        user.PasswordResetToken = newToken;
        user.PasswordResetExpiresAt = DateTime.UtcNow.AddMinutes(30);
        await _context.SaveChangesAsync();

        var baseUrl = _frontend.BaseUrl.TrimEnd('/');
        var resetLink = $"{baseUrl}/reset-password?token={newToken}&email={user.Email}";
        await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, resetLink);

        await _auditLogService.LogAsync(user.Id, "Password Reset Resent", "User", user.Id.ToString(), "", user.FullName);
        _logger.LogInformation("Password reset link resent to {Email}", user.Email);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.PasswordResetToken == request.Token && !u.IsDeleted);

        if (user == null)
        {
            throw new InvalidOperationException("Invalid password reset request.");
        }

        if (user.PasswordResetExpiresAt.HasValue && user.PasswordResetExpiresAt.Value < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Password reset token has expired.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpiresAt = null;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(user.Id, "Password Reset", "User", user.Id.ToString(), "", user.FullName);
        _logger.LogInformation("Password reset completed for {Email}", user.Email);
    }

    public async Task ResendInvitationAsync(Guid userId, Guid currentUserId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted)
            ?? throw new KeyNotFoundException("User not found");

        if (user.Status != "Draft" && user.Status != "InvitationSent")
        {
            throw new InvalidOperationException("Cannot resend invitation. User is not in invitation status.");
        }

        var temporaryPassword = GenerateRandomPassword();
        var activationToken = Guid.NewGuid().ToString();

        user.TemporaryPasswordHash = BCrypt.Net.BCrypt.HashPassword(temporaryPassword);
        user.TemporaryPasswordExpiresAt = DateTime.UtcNow.AddHours(72);
        user.ActivationToken = activationToken;
        user.ActivationExpiry = DateTime.UtcNow.AddHours(24);
        user.InvitationSentAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Resending welcome email to {Recipient}...", user.Email);

        try
        {
            await _emailService.SendWelcomeEmailAsync(user.Email, user.FullName, temporaryPassword, activationToken);
            user.Status = "InvitationSent";
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend invitation email to {Email}", user.Email);
            throw new InvalidOperationException($"Invitation email failed: {ex.Message}", ex);
        }

        await _auditLogService.LogAsync(currentUserId, "Invitation Resent", "User", user.Id.ToString(), "", user.FullName);
        _logger.LogInformation("Invitation resent to {Email}", user.Email);
    }

    public async Task SendInvitationAsync(Guid userId, Guid currentUserId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted)
            ?? throw new KeyNotFoundException("User not found");

        var temporaryPassword = GenerateRandomPassword();
        var activationToken = Guid.NewGuid().ToString();

        user.TemporaryPasswordHash = BCrypt.Net.BCrypt.HashPassword(temporaryPassword);
        user.TemporaryPasswordExpiresAt = DateTime.UtcNow.AddDays(7);
        user.ActivationToken = activationToken;
        user.ActivationExpiry = DateTime.UtcNow.AddDays(7);
        user.InvitationSentAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Sending invitation email to {Recipient}...", user.Email);

        try
        {
            await _emailService.SendWelcomeEmailAsync(user.Email, user.FullName, temporaryPassword, activationToken);
            user.Status = "InvitationSent";
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send invitation email to {Email}", user.Email);
            throw new InvalidOperationException($"Invitation email failed: {ex.Message}", ex);
        }

        await _auditLogService.LogAsync(currentUserId, "Invitation Sent", "User", user.Id.ToString(), "", user.FullName);
        _logger.LogInformation("Invitation sent to {Email}", user.Email);
    }

    public async Task RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);

        if (existingUser != null)
        {
            throw new InvalidOperationException("A user with this email already exists");
        }

        var role = await _context.Roles.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Name == request.Role && !r.IsDeleted);

        if (role == null)
        {
            throw new InvalidOperationException($"Role '{request.Role}' not found");
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId = role.Id,
            IsActive = true,
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(user.Id, "User Registered", "User", user.Id.ToString(), null, user.FullName);
    }

    public async Task<TokenResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var storedRefreshToken = await _tokenService.ValidateRefreshTokenAsync(request.RefreshToken);
        if (storedRefreshToken == null)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token");
        }

        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == storedRefreshToken.UserId && !u.IsDeleted);

        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("User not found or deactivated");
        }

        await _tokenService.MarkRefreshTokenAsUsedAsync(storedRefreshToken.Id);

        return await GenerateTokenResponseAsync(user);
    }

   public async Task<CurrentUserResponse> GetCurrentUserAsync(Guid userId)
{
    var user = await _context.Users.AsNoTracking()
        .Include(u => u.Role)
        .Include(u => u.CollegeEntity)
        .Include(u => u.DepartmentEntity)
        .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

    if (user == null)
    {
        throw new KeyNotFoundException("User not found");
    }

    var response = _mapper.Map<CurrentUserResponse>(user);

    var profilePictureUrl = await _context.StudentProfiles
        .AsNoTracking()
        .Where(sp => sp.UserId == userId && !sp.IsDeleted)
        .Select(sp => sp.ProfilePictureUrl)
        .FirstOrDefaultAsync();

    response.ProfilePictureUrl = profilePictureUrl;

    return response;
}
    public async Task LogoutAsync(Guid userId, string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.UserId == userId);

        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            await _context.SaveChangesAsync();
        }

        await _tokenService.RevokeUserRefreshTokensAsync(userId);

        await _auditLogService.LogAsync(userId, "Logout", "User", userId.ToString(), null, null);
    }

    private async Task<TokenResponse> GenerateTokenResponseAsync(User user)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var jwtId = Guid.NewGuid().ToString();

        var refreshTokenEntity = await _tokenService.CreateRefreshTokenAsync(user, jwtId);

        return new TokenResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenEntity.Token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.Name,
            CollegeId = user.CollegeId?.ToString(),
        };
    }

    private static string GenerateRandomPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
        var random = Random.Shared;
        var password = new char[12];
        for (int i = 0; i < 12; i++)
            password[i] = chars[random.Next(chars.Length)];
        return new string(password);
    }
}
