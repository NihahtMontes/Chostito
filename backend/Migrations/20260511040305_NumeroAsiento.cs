using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Web_Api_Proyecto.Migrations
{
    /// <inheritdoc />
    public partial class NumeroAsiento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NumeroAsiento",
                table: "Entradas",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NumeroAsiento",
                table: "Entradas");
        }
    }
}
