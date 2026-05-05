using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Data;
using Web_Api_Proyecto.Models;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FavoritosController : ControllerBase
{
    private readonly ChostitoDbContext _context;

    public FavoritosController(ChostitoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<object>>> GetMisFavoritos()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var favoritos = await _context.Favoritos
            .Include(f => f.Evento)
            .ThenInclude(e => e!.Categoria)
            .Include(f => f.Evento)
            .ThenInclude(e => e!.Lugar)
            .Where(f => f.IdUsuario == userId)
            .Select(f => new
            {
                f.Id,
                f.FechaAgregado,
                Evento = new
                {
                    f.Evento!.Id,
                    f.Evento.Titulo,
                    f.Evento.Eslogan,
                    f.Evento.Fecha,
                    f.Evento.ImagenUrl,
                    f.Evento.Estado,
                    Categoria = f.Evento.Categoria!.Nombre,
                    Lugar = f.Evento.Lugar!.Nombre,
                    Ciudad = f.Evento.Lugar.Ciudad
                }
            })
            .ToListAsync();

        return favoritos;
    }

    [HttpPost("{eventoId}")]
    [Authorize]
    public async Task<IActionResult> AgregarFavorito(int eventoId)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var evento = await _context.Eventos.FindAsync(eventoId);
        if (evento == null) return NotFound(new { message = "Evento no encontrado" });

        var existe = await _context.Favoritos.AnyAsync(f => f.IdUsuario == userId && f.IdEvento == eventoId);
        if (existe) return BadRequest(new { message = "Ya esta en favoritos" });

        var favorito = new Favorito { IdUsuario = userId, IdEvento = eventoId };
        _context.Favoritos.Add(favorito);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Agregado a favoritos" });
    }

    [HttpDelete("{eventoId}")]
    [Authorize]
    public async Task<IActionResult> EliminarFavorito(int eventoId)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var favorito = await _context.Favoritos.FirstOrDefaultAsync(f => f.IdUsuario == userId && f.IdEvento == eventoId);
        if (favorito == null) return NotFound(new { message = "No encontrado en favoritos" });

        _context.Favoritos.Remove(favorito);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Eliminado de favoritos" });
    }
}
