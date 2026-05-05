using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Data;
using Web_Api_Proyecto.DTOs;
using Web_Api_Proyecto.Models;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventosController : ControllerBase
{
    private readonly ChostitoDbContext _context;
    private readonly IWebHostEnvironment _env;

    public EventosController(ChostitoDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EventoResponseDTO>>> GetAll(
        [FromQuery] int? categoriaId,
        [FromQuery] DateTime? fechaDesde,
        [FromQuery] DateTime? fechaHasta,
        [FromQuery] string? busqueda,
        [FromQuery] string? estado)
    {
        var query = _context.Eventos
            .Include(e => e.Categoria)
            .Include(e => e.Organizador)
            .Include(e => e.Lugar)
            .AsQueryable();

        if (categoriaId.HasValue) query = query.Where(e => e.IdCategoria == categoriaId);
        if (fechaDesde.HasValue) query = query.Where(e => e.Fecha >= fechaDesde);
        if (fechaHasta.HasValue) query = query.Where(e => e.Fecha <= fechaHasta);
        if (!string.IsNullOrWhiteSpace(busqueda))
            query = query.Where(e => e.Titulo.Contains(busqueda) || e.Eslogan.Contains(busqueda));
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(e => e.Estado == estado);

        var eventos = await query.OrderBy(e => e.Fecha).ToListAsync();

        return eventos.Select(e => new EventoResponseDTO
        {
            Id = e.Id,
            Titulo = e.Titulo,
            Eslogan = e.Eslogan,
            Descripcion = e.Descripcion,
            Fecha = e.Fecha,
            Hora = e.Hora,
            ImagenUrl = e.ImagenUrl,
            Estado = e.Estado,
            Categoria = e.Categoria!.Nombre,
            Organizador = e.Organizador!.Nombre,
            Lugar = e.Lugar!.Nombre,
            Ciudad = e.Lugar.Ciudad,
            Pais = e.Lugar.Pais
        }).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EventoResponseDTO>> GetById(int id)
    {
        var evento = await _context.Eventos
            .Include(e => e.Categoria)
            .Include(e => e.Organizador)
            .Include(e => e.Lugar)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (evento == null) return NotFound(new { message = "Evento no encontrado" });

        return new EventoResponseDTO
        {
            Id = evento.Id,
            Titulo = evento.Titulo,
            Eslogan = evento.Eslogan,
            Descripcion = evento.Descripcion,
            Fecha = evento.Fecha,
            Hora = evento.Hora,
            ImagenUrl = evento.ImagenUrl,
            Estado = evento.Estado,
            Categoria = evento.Categoria!.Nombre,
            Organizador = evento.Organizador!.Nombre,
            Lugar = evento.Lugar!.Nombre,
            Ciudad = evento.Lugar.Ciudad,
            Pais = evento.Lugar.Pais
        };
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<ActionResult<Evento>> Create([FromForm] EventoCreateDTO dto, IFormFile? imagen)
    {
        var organizadorId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var evento = new Evento
        {
            Titulo = dto.Titulo,
            Eslogan = dto.Eslogan,
            Descripcion = dto.Descripcion,
            Fecha = dto.Fecha,
            Hora = dto.Hora,
            Estado = dto.Estado,
            IdCategoria = dto.IdCategoria,
            IdOrganizador = organizadorId,
            IdLugar = dto.IdLugar
        };

        if (imagen != null && imagen.Length > 0)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
            Directory.CreateDirectory(uploadsFolder);
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(imagen.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
                await imagen.CopyToAsync(stream);
            evento.ImagenUrl = $"/uploads/{fileName}";
        }

        _context.Eventos.Add(evento);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = evento.Id }, evento);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<IActionResult> Update(int id, [FromForm] EventoUpdateDTO dto, IFormFile? imagen)
    {
        var evento = await _context.Eventos.FindAsync(id);
        if (evento == null) return NotFound(new { message = "Evento no encontrado" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;
        if (userRole != "Admin" && evento.IdOrganizador != userId)
            return Forbid();

        if (dto.Titulo != null) evento.Titulo = dto.Titulo;
        if (dto.Eslogan != null) evento.Eslogan = dto.Eslogan;
        if (dto.Descripcion != null) evento.Descripcion = dto.Descripcion;
        if (dto.Fecha.HasValue) evento.Fecha = dto.Fecha.Value;
        if (dto.Hora.HasValue) evento.Hora = dto.Hora.Value;
        if (dto.IdCategoria.HasValue) evento.IdCategoria = dto.IdCategoria.Value;
        if (dto.IdLugar.HasValue) evento.IdLugar = dto.IdLugar.Value;
        if (dto.Estado != null) evento.Estado = dto.Estado;

        if (imagen != null && imagen.Length > 0)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
            Directory.CreateDirectory(uploadsFolder);
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(imagen.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
                await imagen.CopyToAsync(stream);
            evento.ImagenUrl = $"/uploads/{fileName}";
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<IActionResult> Delete(int id)
    {
        var evento = await _context.Eventos.FindAsync(id);
        if (evento == null) return NotFound(new { message = "Evento no encontrado" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;
        if (userRole != "Admin" && evento.IdOrganizador != userId)
            return Forbid();

        _context.Eventos.Remove(evento);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("mis-eventos")]
    [Authorize(Roles = "Organizador,Admin")]
    public async Task<ActionResult<IEnumerable<EventoResponseDTO>>> GetMisEventos()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var eventos = await _context.Eventos
            .Include(e => e.Categoria)
            .Include(e => e.Organizador)
            .Include(e => e.Lugar)
            .Where(e => e.IdOrganizador == userId)
            .OrderByDescending(e => e.FechaCreacion)
            .ToListAsync();

        return eventos.Select(e => new EventoResponseDTO
        {
            Id = e.Id,
            Titulo = e.Titulo,
            Eslogan = e.Eslogan,
            Descripcion = e.Descripcion,
            Fecha = e.Fecha,
            Hora = e.Hora,
            ImagenUrl = e.ImagenUrl,
            Estado = e.Estado,
            Categoria = e.Categoria!.Nombre,
            Organizador = e.Organizador!.Nombre,
            Lugar = e.Lugar!.Nombre,
            Ciudad = e.Lugar.Ciudad,
            Pais = e.Lugar.Pais
        }).ToList();
    }

    [HttpGet("{id}/entradas")]
    public async Task<ActionResult<IEnumerable<EntradaResponseDTO>>> GetEntradasEvento(int id)
    {
        var evento = await _context.Eventos.FindAsync(id);
        if (evento == null) return NotFound(new { message = "Evento no encontrado" });

        var entradas = await _context.Entradas
            .Where(e => e.IdEvento == id)
            .GroupBy(e => new { e.Tipo, e.Precio })
            .Select(g => new EntradaResponseDTO
            {
                Tipo = g.Key.Tipo,
                Precio = g.Key.Precio,
                CantidadDisponible = g.Count(e => e.Estado == "Activa")
            })
            .ToListAsync();

        return entradas;
    }

    [HttpPost("{id}/entradas")]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<IActionResult> AgregarEntradas(int id, [FromBody] EntradaCreateDTO dto)
    {
        var evento = await _context.Eventos.FindAsync(id);
        if (evento == null) return NotFound(new { message = "Evento no encontrado" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;
        if (userRole != "Admin" && evento.IdOrganizador != userId)
            return Forbid();

        var entradas = new List<Entrada>();
        for (int i = 0; i < dto.Cantidad; i++)
        {
            entradas.Add(new Entrada
            {
                Tipo = dto.Tipo,
                Precio = dto.Precio,
                IdEvento = id,
                CodigoQR = Guid.NewGuid().ToString()
            });
        }

        _context.Entradas.AddRange(entradas);
        await _context.SaveChangesAsync();
        return Ok(new { message = $"{dto.Cantidad} entradas de tipo {dto.Tipo} agregadas" });
    }
}
