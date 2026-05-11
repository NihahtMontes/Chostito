using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Data;
using Web_Api_Proyecto.DTOs;
using Web_Api_Proyecto.Models;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservasController : ControllerBase
{
    private readonly ChostitoDbContext _context;

    public ReservasController(ChostitoDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<ReservaResponseDTO>> CrearReserva([FromBody] ReservaCreateDTO dto)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        decimal total = 0;
        int cantidadTotal = 0;
        var entradasCreadas = new List<Entrada>();

        if (dto.IdsEntradas != null && dto.IdsEntradas.Any())
        {
            var entradas = await _context.Entradas
                .Where(e => dto.IdsEntradas.Contains(e.Id) && e.Estado == "Activa" && e.IdReserva == null)
                .ToListAsync();

            if (entradas.Count != dto.IdsEntradas.Count)
                return BadRequest(new { message = "Algunos asientos ya no estan disponibles" });

            foreach (var entrada in entradas)
            {
                total += entrada.Precio;
                cantidadTotal++;
                entradasCreadas.Add(entrada);
            }
        }

        if (dto.Items != null && dto.Items.Any())
        {
            foreach (var item in dto.Items)
        {
            var evento = await _context.Eventos.FindAsync(item.IdEvento);
            if (evento == null) return BadRequest(new { message = $"Evento {item.IdEvento} no encontrado" });
            if (evento.Estado != "Publicado") return BadRequest(new { message = $"Evento '{evento.Titulo}' no esta publicado" });

            var entradasDisponibles = await _context.Entradas
                .CountAsync(e => e.IdEvento == item.IdEvento && e.Tipo == item.Tipo && e.Estado == "Activa" && e.IdReserva == null);

            if (entradasDisponibles < item.Cantidad)
                return BadRequest(new { message = $"Solo hay {entradasDisponibles} entradas de tipo {item.Tipo} disponibles para {evento.Titulo}" });

            var entradas = await _context.Entradas
                .Where(e => e.IdEvento == item.IdEvento && e.Tipo == item.Tipo && e.Estado == "Activa" && e.IdReserva == null)
                .Take(item.Cantidad)
                .ToListAsync();

            foreach (var entrada in entradas)
            {
                total += entrada.Precio;
                cantidadTotal++;
                entradasCreadas.Add(entrada);
            }
        }
    }

    if (entradasCreadas.Count == 0) return BadRequest(new { message = "No se seleccionaron entradas validas" });

        var reserva = new Reserva
        {
            IdUsuario = userId,
            Total = total,
            CantidadEntradas = cantidadTotal,
            Estado = "Pendiente",
            FechaReserva = DateTime.UtcNow
        };

        _context.Reservas.Add(reserva);
        await _context.SaveChangesAsync();

        foreach (var entrada in entradasCreadas)
        {
            entrada.IdReserva = reserva.Id;
            entrada.Estado = "Activa";
        }

        var pago = new Pago
        {
            IdReserva = reserva.Id,
            Monto = total,
            MetodoPago = "QR",
            Estado = "Pendiente",
            CodigoTransaccion = Guid.NewGuid().ToString()
        };

        _context.Pagos.Add(pago);
        await _context.SaveChangesAsync();

        return await MapReservaToDTO(reserva);
    }

    [HttpGet("mis-reservas")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ReservaResponseDTO>>> GetMisReservas()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var reservas = await _context.Reservas
            .Include(r => r.Pago)
            .Where(r => r.IdUsuario == userId)
            .OrderByDescending(r => r.FechaReserva)
            .ToListAsync();

        var result = new List<ReservaResponseDTO>();
        foreach (var r in reservas) result.Add(await MapReservaToDTO(r));
        return result;
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ReservaResponseDTO>> GetById(int id)
    {
        var reserva = await _context.Reservas
            .Include(r => r.Pago)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reserva == null) return NotFound(new { message = "Reserva no encontrada" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;
        if (userRole != "Admin" && reserva.IdUsuario != userId) return Forbid();

        return await MapReservaToDTO(reserva);
    }

    [HttpPut("{id}/cancelar")]
    [Authorize]
    public async Task<IActionResult> Cancelar(int id)
    {
        var reserva = await _context.Reservas
            .Include(r => r.Entradas)
            .Include(r => r.Pago)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reserva == null) return NotFound(new { message = "Reserva no encontrada" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;
        if (userRole != "Admin" && reserva.IdUsuario != userId) return Forbid();

        if (reserva.Estado == "Cancelada") return BadRequest(new { message = "La reserva ya esta cancelada" });

        reserva.Estado = "Cancelada";
        foreach (var entrada in reserva.Entradas!) entrada.Estado = "Cancelada";
        if (reserva.Pago != null)
        {
            if (reserva.Pago.Estado == "Completado") reserva.Pago.Estado = "Reembolsado";
            else reserva.Pago.Estado = "Rechazado";
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Reserva cancelada exitosamente" });
    }

    [HttpGet("evento/{eventoId}")]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<ActionResult<IEnumerable<ReservaResponseDTO>>> GetReservasPorEvento(int eventoId)
    {
        var reservaIds = await _context.Entradas
            .Where(e => e.IdEvento == eventoId && e.IdReserva != null)
            .Select(e => e.IdReserva!.Value)
            .Distinct()
            .ToListAsync();

        var reservas = await _context.Reservas
            .Include(r => r.Pago)
            .Where(r => reservaIds.Contains(r.Id))
            .OrderByDescending(r => r.FechaReserva)
            .ToListAsync();

        var result = new List<ReservaResponseDTO>();
        foreach (var r in reservas) result.Add(await MapReservaToDTO(r));
        return result;
    }

    private async Task<ReservaResponseDTO> MapReservaToDTO(Reserva r)
    {
        var entradas = await _context.Entradas
            .Include(e => e.Evento)
            .Where(e => e.IdReserva == r.Id)
            .ToListAsync();

        return new ReservaResponseDTO
        {
            Id = r.Id,
            FechaReserva = r.FechaReserva,
            Total = r.Total,
            CantidadEntradas = r.CantidadEntradas,
            Estado = r.Estado,
            Entradas = entradas.Select(e => new EntradaDetalleDTO
            {
                Id = e.Id,
                Tipo = e.Tipo,
                Precio = e.Precio,
                CodigoQR = e.CodigoQR,
                Estado = e.Estado,
                Evento = e.Evento!.Titulo,
                FechaEvento = e.Evento.Fecha,
                NumeroAsiento = e.NumeroAsiento
            }).ToList(),
            Pago = r.Pago != null ? new PagoResponseDTO
            {
                Id = r.Pago.Id,
                Monto = r.Pago.Monto,
                MetodoPago = r.Pago.MetodoPago,
                Estado = r.Pago.Estado,
                FechaPago = r.Pago.FechaPago,
                CodigoTransaccion = r.Pago.CodigoTransaccion
            } : null
        };
    }
}
