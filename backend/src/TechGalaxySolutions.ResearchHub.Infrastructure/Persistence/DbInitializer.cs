// using Microsoft.EntityFrameworkCore;
// using TechGalaxySolutions.ResearchHub.Domain.Entities;

// namespace TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

// public static class DbInitializer
// {
//     public static async Task SeedAsync(ApplicationDbContext context)
//     {
//        var existingStudent = await context.Users
//     .FirstOrDefaultAsync(u => u.Email == "student@iitb.ac.in" && !u.IsDeleted);

    

// if (existingStudent == null)
// {
//     // continue with your existing seed code
// }
//         var superAdminRole = new Role
//         {
//             Id = Guid.Parse("00000001-0000-0000-0000-000000000001"),
//             Name = "SuperAdmin",
//             IsActive = true,
//             CreatedAt = DateTime.UtcNow,
//         };

//         var guideRole = new Role
//         {
//             Id = Guid.Parse("B2C3D4E5-F6A7-8901-BCDE-F12345678901"),
//             Name = "Guide",
//             IsActive = true,
//             CreatedAt = DateTime.UtcNow,
//         };

//         var studentRole = new Role
//         {
//             Id = Guid.Parse("C3D4E5F6-A7B8-9012-CDEF-123456789012"),
//             Name = "Student",
//             IsActive = true,
//             CreatedAt = DateTime.UtcNow,
//         };

//         var adminRole = new Role
//         {
//             Id = Guid.Parse("F6A7B8C9-D0E1-2345-ABCD-1234567890AB"),
//             Name = "CollegeAdmin",
//             IsActive = true,
//             CreatedAt = DateTime.UtcNow,
//         };

//         var hodRole = new Role
//         {
//             Id = Guid.Parse("E5F6A7B8-C9D0-1234-EF12-345678901234"),
//             Name = "HOD",
//             IsActive = true,
//             CreatedAt = DateTime.UtcNow,
//         };

//         context.Roles.AddRange(superAdminRole, adminRole, guideRole, studentRole, hodRole);

//         var superAdmin = new User
//         {
//             Id = Guid.Parse("D4E5F6A7-B8C9-0123-DEF1-234567890123"),
//             FullName = "Super Admin",
//             Email = "superadmin@researchhub.com",
//             PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
//             IsActive = true,
//             RoleId = superAdminRole.Id,
//             Status = "Active",
//             EmailVerified = true,
//             CreatedAt = DateTime.UtcNow,
//         };

//         var adminUser = new User
//         {
//             Id = Guid.Parse("1B2C3D4E-5F6A-7890-ABCD-EF1234567890"),
//             FullName = "Admin User",
//             Email = "admin@researchhub.com",
//             PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
//             IsActive = true,
//             RoleId = adminRole.Id,
//             Status = "Active",
//             EmailVerified = true,
//             CreatedAt = DateTime.UtcNow,
//         };

//         var studentUser = new User
//         {
//             Id = Guid.Parse("7C9E6679-7425-40DE-944B-E07FC1F90AE7"),
//             FullName = "Priya Sharma",
//             Email = "student@iitb.ac.in",
//             PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123"),
//             IsActive = true,
//             RoleId = studentRole.Id,
//             Status = "Active",
//             EmailVerified = true,
//             CreatedAt = DateTime.UtcNow,
//         };

//         var guideUser = new User
//         {
//             Id = Guid.Parse("B0E7A8D1-F93A-4A9B-9B6E-7B3F2C1A8D4E"),
//             FullName = "Dr. Rajesh Mehta",
//             Email = "guide@iitb.ac.in",
//             PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide@123"),
//             IsActive = true,
//             RoleId = guideRole.Id,
//             Status = "Active",
//             EmailVerified = true,
//             CreatedAt = DateTime.UtcNow,
//         };

//         var hodUser = new User
//         {
//             Id = Guid.Parse("A6A29C02-91F6-4169-B48D-EC44A6F018BA"),
//             FullName = "HOD User",
//             Email = "hod@researchhub.com",
//             PasswordHash = BCrypt.Net.BCrypt.HashPassword("Hod@123"),
//             IsActive = true,
//             RoleId = hodRole.Id,
//             Status = "Active",
//             EmailVerified = true,
//             CreatedAt = DateTime.UtcNow,
//             Department = "Information Technology",
//             College = "MIT",
//         };

//         context.Users.AddRange(superAdmin, adminUser, studentUser, guideUser, hodUser);

//         await context.SaveChangesAsync();
//     }
// }


using Microsoft.EntityFrameworkCore;
using TechGalaxySolutions.ResearchHub.Domain.Entities;

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context)
{
    // ============================
    // Ensure Student Role exists
    // ============================
    var studentRole = await context.Roles
        .FirstOrDefaultAsync(r => r.Name == "Student");

    if (studentRole == null)
    {
        studentRole = new Role
        {
            Id = Guid.Parse("C3D4E5F6-A7B8-9012-CDEF-123456789012"),
            Name = "Student",
            Description = "Student role",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        context.Roles.Add(studentRole);
        await context.SaveChangesAsync();
    }

    // ============================
    // Ensure Student User exists
    // ============================

    var studentId =
        Guid.Parse("7C9E6679-7425-40DE-944B-E07FC1F90AE7");

    // IMPORTANT:
    // Search by ID WITHOUT filtering IsDeleted.
    // The duplicate PK error proves this ID already exists.
    var studentUser = await context.Users
        .FirstOrDefaultAsync(u => u.Id == studentId);

    if (studentUser == null)
    {
        // Create only if the ID really doesn't exist
        studentUser = new User
        {
            Id = studentId,
            FullName = "Priya Sharma",
            Email = "student@iitb.ac.in",

            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword("Student@123"),

            IsActive = true,
            RoleId = studentRole.Id,
            Status = "Active",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(studentUser);
    }
    else
    {
        // ============================
        // Existing user -> UPDATE
        // ============================

        studentUser.FullName = "Priya Sharma";
        studentUser.Email = "student@iitb.ac.in";

        // Reset password
        studentUser.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword("Student@123");

        studentUser.IsActive = true;
        studentUser.RoleId = studentRole.Id;
        studentUser.Status = "Active";
        studentUser.EmailVerified = true;
        studentUser.UpdatedAt = DateTime.UtcNow;

        // If IsDeleted is a shadow property
        context.Entry(studentUser)
            .Property("IsDeleted")
            .CurrentValue = false;
    }

    await context.SaveChangesAsync();
}
}