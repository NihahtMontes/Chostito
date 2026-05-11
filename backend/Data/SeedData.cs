using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Web_Api_Proyecto.Models;

namespace Web_Api_Proyecto.Data;

public static class SeedData
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        using var context = new ChostitoDbContext(
            serviceProvider.GetRequiredService<DbContextOptions<ChostitoDbContext>>());

        if (context.Usuarios.Any() || context.Categorias.Any())
            return;

        var adminPassword = BCrypt.Net.BCrypt.HashPassword("admin123");
        var clientPassword = BCrypt.Net.BCrypt.HashPassword("cliente123");

        var admin = new Usuario
        {
            Nombre = "Admin Chostito",
            Email = "admin@chostito.com",
            PasswordHash = adminPassword,
            Rol = "Admin",
            Telefono = "555-0001"
        };
        var organizador = new Usuario
        {
            Nombre = "Productora Rock",
            Email = "org@chostito.com",
            PasswordHash = clientPassword,
            Rol = "Organizador",
            Telefono = "555-0002"
        };
        var cliente = new Usuario
        {
            Nombre = "Juan Perez",
            Email = "juan@chostito.com",
            PasswordHash = clientPassword,
            Rol = "Cliente",
            Telefono = "555-0003"
        };

        context.Usuarios.AddRange(admin, organizador, cliente);
        await context.SaveChangesAsync();

        var concierto = new Categoria { Nombre = "Concierto", Descripcion = "Shows musicales en vivo", Icono = "🎵" };
        var teatro = new Categoria { Nombre = "Teatro", Descripcion = "Obras de teatro y musicales", Icono = "🎭" };
        var deporte = new Categoria { Nombre = "Deporte", Descripcion = "Eventos deportivos", Icono = "⚽" };
        var conferencia = new Categoria { Nombre = "Conferencia", Descripcion = "Charlas y conferencias", Icono = "🎤" };

        context.Categorias.AddRange(concierto, teatro, deporte, conferencia);
        await context.SaveChangesAsync();

        var estadio = new Lugar
        {
            Nombre = "Estadio Monumental",
            Direccion = "Av. Figueroa Alcorta 7597",
            Pais = "Argentina",
            Ciudad = "Buenos Aires",
            Ambiente = "Estadio",
            CapacidadTotal = 70000,
            Latitud = -34.5453m,
            Longitud = -58.4497m
        };
        var teatroColon = new Lugar
        {
            Nombre = "Teatro Colon",
            Direccion = "Cerrito 628",
            Pais = "Argentina",
            Ciudad = "Buenos Aires",
            Ambiente = "Teatro",
            CapacidadTotal = 2500,
            Latitud = -34.6011m,
            Longitud = -58.3832m
        };
        var auditorio = new Lugar
        {
            Nombre = "Auditorio Tecnopolis",
            Direccion = "Juan B. Justo 1000",
            Pais = "Argentina",
            Ciudad = "Buenos Aires",
            Ambiente = "Auditorio",
            CapacidadTotal = 5000,
            Latitud = -34.5602m,
            Longitud = -58.5087m
        };

        context.Lugares.AddRange(estadio, teatroColon, auditorio);
        await context.SaveChangesAsync();

        var rockFest = new Evento
        {
            Titulo = "Rock Fest 2026",
            Eslogan = "La noche mas epica del rock",
            Descripcion = "Las mejores bandas de rock en un solo escenario. Una experiencia unica e irrepetible con mas de 8 horas de musica en vivo.",
            Fecha = new DateTime(2026, 6, 15),
            Hora = new TimeSpan(20, 0, 0),
            Estado = "Publicado",
            IdCategoria = concierto.Id,
            IdOrganizador = organizador.Id,
            IdLugar = estadio.Id
        };
        var obraTeatro = new Evento
        {
            Titulo = "Hamlet - Shakespeare",
            Eslogan = "Ser o no ser, esa es la cuestion",
            Descripcion = "La obra maestra de Shakespeare en una adaptacion moderna con tecnologia de vanguardia.",
            Fecha = new DateTime(2026, 7, 20),
            Hora = new TimeSpan(21, 0, 0),
            Estado = "Publicado",
            IdCategoria = teatro.Id,
            IdOrganizador = organizador.Id,
            IdLugar = teatroColon.Id
        };
        var techConf = new Evento
        {
            Titulo = "Tech Conference 2026",
            Eslogan = "El futuro de la tecnologia",
            Descripcion = "Conferencia sobre inteligencia artificial, blockchain y desarrollo de software.",
            Fecha = new DateTime(2026, 8, 10),
            Hora = new TimeSpan(9, 0, 0),
            Estado = "Publicado",
            IdCategoria = conferencia.Id,
            IdOrganizador = organizador.Id,
            IdLugar = auditorio.Id
        };

        context.Eventos.AddRange(rockFest, obraTeatro, techConf);
        await context.SaveChangesAsync();

        await context.SaveChangesAsync();
    }
}
