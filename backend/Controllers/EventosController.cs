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
            .Include(e => e.Entradas)
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
            Pais = e.Lugar.Pais,
            PrecioMinimo = e.Entradas != null && e.Entradas.Any() ? e.Entradas.Min(ent => ent.Precio) : 0
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
    public async Task<ActionResult<object>> Create([FromBody] EventoCreateDTO dto)
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

        _context.Eventos.Add(evento);
        await _context.SaveChangesAsync();
        return Ok(new { id = evento.Id, message = "Evento creado exitosamente" });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<IActionResult> Update(int id, [FromBody] EventoUpdateDTO dto)
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

        await _context.SaveChangesAsync();
        return Ok(new { message = "Evento actualizado exitosamente" });
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

        // Borrar cascada manual: entradas -> pagos -> reservas -> evento
        var entradas = await _context.Entradas.Where(e => e.IdEvento == id).ToListAsync();
        var reservaIds = entradas.Where(e => e.IdReserva.HasValue).Select(e => e.IdReserva!.Value).Distinct().ToList();
        var pagos = await _context.Pagos.Where(p => reservaIds.Contains(p.IdReserva)).ToListAsync();
        _context.Pagos.RemoveRange(pagos);
        _context.Entradas.RemoveRange(entradas);
        var reservas = await _context.Reservas.Where(r => reservaIds.Contains(r.Id)).ToListAsync();
        _context.Reservas.RemoveRange(reservas);
        _context.Eventos.Remove(evento);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("todos")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<EventoResponseDTO>>> GetTodos()
    {
        var eventos = await _context.Eventos
            .Include(e => e.Categoria)
            .Include(e => e.Organizador)
            .Include(e => e.Lugar)
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
                CantidadDisponible = g.Count(e => e.Estado == "Activa"),
                CantidadVendida = g.Count(e => e.IdReserva != null),
                CantidadTotal = g.Count()
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
        if (!string.IsNullOrWhiteSpace(dto.Seccion) && dto.AsientosPorSeccion > 0)
        {
            for (int i = 1; i <= dto.AsientosPorSeccion; i++)
            {
                entradas.Add(new Entrada
                {
                    Tipo = dto.Tipo,
                    Precio = dto.Precio,
                    IdEvento = id,
                    CodigoQR = Guid.NewGuid().ToString(),
                    NumeroAsiento = $"{dto.Seccion}-{i}"
                });
            }
        }
        else
        {
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
        }

        _context.Entradas.AddRange(entradas);
        await _context.SaveChangesAsync();
        return Ok(new { message = $"{entradas.Count} entradas de tipo {dto.Tipo} agregadas" });
    }

    [HttpGet("{id}/asientos")]
    public async Task<ActionResult<List<SeccionAsientosDTO>>> GetAsientos(int id)
    {
        var evento = await _context.Eventos.FindAsync(id);
        if (evento == null) return NotFound(new { message = "Evento no encontrado" });

        var entradas = await _context.Entradas
            .Where(e => e.IdEvento == id && e.NumeroAsiento != null)
            .OrderBy(e => e.NumeroAsiento)
            .ToListAsync();

        if (!entradas.Any()) return Ok(new List<SeccionAsientosDTO>());

        var secciones = entradas
            .GroupBy(e => e.NumeroAsiento!.Split('-')[0])
            .Select(g => new SeccionAsientosDTO
            {
                Seccion = g.Key,
                Asientos = g.Select(e => new AsientoDTO
                {
                    Id = e.Id,
                    Numero = e.NumeroAsiento!,
                    Estado = e.IdReserva != null || e.Estado == "Reservada" ? "Reservada" : e.Estado
                }).ToList()
            }).ToList();

        return secciones;
    }

    [HttpPost("{id}/imagen")]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<IActionResult> SubirImagen(int id, IFormFile imagen)
    {
        var evento = await _context.Eventos.FindAsync(id);
        if (evento == null) return NotFound(new { message = "Evento no encontrado" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;
        if (userRole != "Admin" && evento.IdOrganizador != userId) return Forbid();

        if (imagen == null || imagen.Length == 0) return BadRequest(new { message = "No se recibio imagen" });

        var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadsFolder);
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(imagen.FileName)}";
        var filePath = Path.Combine(uploadsFolder, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
            await imagen.CopyToAsync(stream);
        evento.ImagenUrl = $"/uploads/{fileName}";
        await _context.SaveChangesAsync();
        return Ok(new { imagenUrl = evento.ImagenUrl });
    }

    [HttpPut("{id}/entradas")]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<IActionResult> ReemplazarEntradas(int id, [FromBody] List<EntradaCreateDTO> entradas)
    {
        var evento = await _context.Eventos.FindAsync(id);
        if (evento == null) return NotFound(new { message = "Evento no encontrado" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;
        if (userRole != "Admin" && evento.IdOrganizador != userId) return Forbid();

        var existentes = await _context.Entradas
            .Where(e => e.IdEvento == id && e.IdReserva == null)
            .ToListAsync();
        _context.Entradas.RemoveRange(existentes);

        foreach (var dto in entradas)
        {
            if (!string.IsNullOrWhiteSpace(dto.Seccion) && dto.AsientosPorSeccion > 0)
            {
                for (int i = 1; i <= dto.AsientosPorSeccion; i++)
                {
                    _context.Entradas.Add(new Entrada
                    {
                        Tipo = dto.Tipo,
                        Precio = dto.Precio,
                        IdEvento = id,
                        CodigoQR = Guid.NewGuid().ToString(),
                        NumeroAsiento = $"{dto.Seccion}-{i}",
                        Estado = "Activa"
                    });
                }
            }
            else
            {
                for (int i = 0; i < dto.Cantidad; i++)
                {
                    _context.Entradas.Add(new Entrada
                    {
                        Tipo = dto.Tipo,
                        Precio = dto.Precio,
                        IdEvento = id,
                        CodigoQR = Guid.NewGuid().ToString(),
                        Estado = "Activa"
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Entradas actualizadas exitosamente" });
    }
}
