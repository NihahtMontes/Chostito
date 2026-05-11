using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Data;
using Web_Api_Proyecto.DTOs;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly ChostitoDbContext _context;

    public DashboardController(ChostitoDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DashboardStatsDTO>> GetStats()
    {
        var stats = new DashboardStatsDTO
        {
            TotalEventos = await _context.Eventos.CountAsync(),
            TotalReservas = await _context.Reservas.CountAsync(r => r.Estado == "Confirmada"),
            TotalRecaudado = await _context.Pagos
                .Where(p => p.Estado == "Completado")
                .SumAsync(p => (decimal?)p.Monto) ?? 0,
            TotalUsuarios = await _context.Usuarios.CountAsync(),
            EntradasVendidas = await _context.Entradas.CountAsync(e => e.Estado == "Activa" && e.IdReserva != null)
        };

        return stats;
    }

    [HttpGet("mis-ventas")]
    [Authorize(Roles = "Organizador,Admin")]
    public async Task<ActionResult<IEnumerable<object>>> GetMisVentas()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var ventas = await _context.Eventos
            .Where(e => e.IdOrganizador == userId)
            .Select(e => new
            {
                e.Id,
                e.Titulo,
                e.Fecha,
                e.Estado,
                e.ImagenUrl,
                EntradasVendidas = _context.Entradas.Count(en => en.IdEvento == e.Id && en.IdReserva != null),
                EntradasTotales = _context.Entradas.Count(en => en.IdEvento == e.Id),
                TotalRecaudado = _context.Entradas
                    .Where(en => en.IdEvento == e.Id && en.IdReserva != null)
                    .Sum(en => (decimal?)en.Precio) ?? 0
            })
            .OrderByDescending(v => v.Fecha)
            .ToListAsync();

        return ventas;
    }

    [HttpGet("todas-ganancias")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<object>>> GetTodasGanancias()
    {
        var ganancias = await _context.Eventos
            .Include(e => e.Organizador)
            .Select(e => new
            {
                e.Id,
                e.Titulo,
                Organizador = e.Organizador!.Nombre,
                e.Estado,
                e.ImagenUrl,
                EntradasVendidas = _context.Entradas.Count(en => en.IdEvento == e.Id && en.IdReserva != null),
                EntradasTotales = _context.Entradas.Count(en => en.IdEvento == e.Id),
                TotalRecaudado = _context.Entradas
                    .Where(en => en.IdEvento == e.Id && en.IdReserva != null)
                    .Sum(en => (decimal?)en.Precio) ?? 0
            })
            .OrderByDescending(v => v.TotalRecaudado)
            .ToListAsync();

        return ganancias;
    }

    [HttpPost("entradas/escanear")]
    [Authorize(Roles = "Organizador,Admin")]
    public async Task<IActionResult> EscanearQR([FromBody] EscanearQRRequest request)
    {
        var entrada = await _context.Entradas
            .Include(e => e.Reserva)
            .Include(e => e.Evento)
            .FirstOrDefaultAsync(e => e.CodigoQR == request.CodigoQR);

        if (entrada == null) return NotFound(new { message = "Entrada no valida" });
        if (entrada.Estado == "Usada") return BadRequest(new { message = "Entrada ya fue utilizada" });
        if (entrada.Estado == "Cancelada") return BadRequest(new { message = "Entrada cancelada" });
        if (entrada.Reserva!.Estado != "Confirmada") return BadRequest(new { message = "Reserva no confirmada" });

        entrada.Estado = "Usada";
        await _context.SaveChangesAsync();

        var reserva = entrada.Reserva;
        var comprador = await _context.Usuarios.FindAsync(reserva!.IdUsuario);
        var pago = await _context.Pagos.FirstOrDefaultAsync(p => p.IdReserva == reserva.Id);

        return Ok(new
        {
            message = "Entrada validada exitosamente",
            tipo = entrada.Tipo,
            evento = entrada.Evento!.Titulo,
            fecha = entrada.Evento.Fecha,
            comprador = comprador?.Nombre ?? "Desconocido",
            emailComprador = comprador?.Email,
            codigoTransaccion = pago?.CodigoTransaccion
        });
    }
}
