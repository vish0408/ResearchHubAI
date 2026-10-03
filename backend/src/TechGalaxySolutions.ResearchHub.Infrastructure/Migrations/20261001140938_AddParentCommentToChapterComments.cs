using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddParentCommentToChapterComments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ParentCommentId",
                table: "ChapterComments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChapterComments_ParentCommentId",
                table: "ChapterComments",
                column: "ParentCommentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChapterComments_ChapterComments_ParentCommentId",
                table: "ChapterComments",
                column: "ParentCommentId",
                principalTable: "ChapterComments",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChapterComments_ChapterComments_ParentCommentId",
                table: "ChapterComments");

            migrationBuilder.DropIndex(
                name: "IX_ChapterComments_ParentCommentId",
                table: "ChapterComments");

            migrationBuilder.DropColumn(
                name: "ParentCommentId",
                table: "ChapterComments");
        }
    }
}
