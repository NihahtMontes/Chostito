using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Web_Api_Proyecto.Migrations
{
    /// <inheritdoc />
    public partial class CamposExtendidos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FotoUrl",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitud",
                table: "Lugares",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitud",
                table: "Lugares",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FotoUrl",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Latitud",
                table: "Lugares");

            migrationBuilder.DropColumn(
                name: "Longitud",
                table: "Lugares");
        }
    }
}
