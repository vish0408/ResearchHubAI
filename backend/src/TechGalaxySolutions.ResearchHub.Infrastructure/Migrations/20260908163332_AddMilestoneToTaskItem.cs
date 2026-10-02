using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechGalaxySolutions.ResearchHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMilestoneToTaskItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "MilestoneId",
                table: "TaskItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_MilestoneId",
                table: "TaskItems",
                column: "MilestoneId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_Milestones_MilestoneId",
                table: "TaskItems",
                column: "MilestoneId",
                principalTable: "Milestones",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_Milestones_MilestoneId",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_MilestoneId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "MilestoneId",
                table: "TaskItems");
        }
    }
}
