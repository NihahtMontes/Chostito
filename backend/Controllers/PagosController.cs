using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Data;
using Web_Api_Proyecto.DTOs;
using Web_Api_Proyecto.Models;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PagosController : ControllerBase
{
    private readonly ChostitoDbContext _context;

    public PagosController(ChostitoDbContext context)
    {
        _context = context;
    }

    [HttpGet("reserva/{reservaId}")]
    [Authorize]
    public async Task<ActionResult<PagoResponseDTO>> GetPagoPorReserva(int reservaId)
    {
        var pago = await _context.Pagos
            .Include(p => p.Reserva)
            .FirstOrDefaultAsync(p => p.IdReserva == reservaId);

        if (pago == null) return NotFound(new { message = "Pago no encontrado" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;
        if (userRole != "Admin" && pago.Reserva!.IdUsuario != userId) return Forbid();

        return new PagoResponseDTO
        {
            Id = pago.Id,
            Monto = pago.Monto,
            MetodoPago = pago.MetodoPago,
            Estado = pago.Estado,
            FechaPago = pago.FechaPago,
            CodigoTransaccion = pago.CodigoTransaccion
        };
    }

    [HttpPost("{reservaId}/pagar")]
    [Authorize]
    public async Task<IActionResult> SimularPago(int reservaId, [FromBody] SimularPagoRequest request)
    {
        var pago = await _context.Pagos
            .Include(p => p.Reserva)
            .ThenInclude(r => r!.Entradas)
            .FirstOrDefaultAsync(p => p.IdReserva == reservaId);

        if (pago == null) return NotFound(new { message = "Pago no encontrado" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;
        if (userRole != "Admin" && pago.Reserva!.IdUsuario != userId) return Forbid();

        if (pago.Estado != "Pendiente") return BadRequest(new { message = $"El pago ya esta en estado: {pago.Estado}" });

        pago.Estado = "Completado";
        pago.MetodoPago = request.MetodoPago;
        pago.FechaPago = DateTime.UtcNow;

        if (pago.Reserva != null)
        {
            pago.Reserva.Estado = "Confirmada";
            foreach (var entrada in pago.Reserva.Entradas!)
                entrada.Estado = "Activa";
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Pago completado exitosamente", codigoTransaccion = pago.CodigoTransaccion });
    }

    [HttpPost("{reservaId}/qr")]
    [Authorize]
    public async Task<IActionResult> GenerarQRPago(int reservaId)
    {
        var pago = await _context.Pagos
            .Include(p => p.Reserva)
            .FirstOrDefaultAsync(p => p.IdReserva == reservaId);

        if (pago == null) return NotFound(new { message = "Pago no encontrado" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;
        if (userRole != "Admin" && pago.Reserva!.IdUsuario != userId) return Forbid();

        return Ok(new
        {
            codigoTransaccion = pago.CodigoTransaccion,
            monto = pago.Monto,
            metodoPago = "QR",
            estado = pago.Estado,
            qrData = $"CHOSTITO|{pago.CodigoTransaccion}|{pago.Monto}|{pago.Reserva!.Id}"
        });
    }

    [HttpPut("{id}/estado")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] string estado)
    {
        var pago = await _context.Pagos.FindAsync(id);
        if (pago == null) return NotFound(new { message = "Pago no encontrado" });

        pago.Estado = estado;
        await _context.SaveChangesAsync();
        return Ok(new { message = $"Estado del pago actualizado a: {estado}" });
    }
}
