using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChapterCommentResolution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsResolved",
                table: "ChapterComments",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsResolved",
                table: "ChapterComments");
        }
    }
}
