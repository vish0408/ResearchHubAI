using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChapterVersions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChapterVersions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VersionNumber = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChapterVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChapterVersions_Chapters_ChapterId",
                        column: x => x.ChapterId,
                        principalTable: "Chapters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChapterVersions_ChapterId",
                table: "ChapterVersions",
                column: "ChapterId");

            migrationBuilder.CreateIndex(
                name: "IX_ChapterVersions_ChapterId_VersionNumber",
                table: "ChapterVersions",
                columns: new[] { "ChapterId", "VersionNumber" },
                unique: true,
                filter: "[IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChapterVersions");
        }
    }
}
