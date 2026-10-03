using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackThreadId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FeedbackThreadId",
                table: "ChapterComments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChapterComments_FeedbackThreadId",
                table: "ChapterComments",
                column: "FeedbackThreadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChapterComments_FeedbackThreadId",
                table: "ChapterComments");

            migrationBuilder.DropColumn(
                name: "FeedbackThreadId",
                table: "ChapterComments");
        }
    }
}
