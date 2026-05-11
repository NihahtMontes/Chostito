using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Data;
using Web_Api_Proyecto.DTOs;
using Web_Api_Proyecto.Models;
using Web_Api_Proyecto.Services;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PagosController : ControllerBase
{
    private readonly ChostitoDbContext _context;
    private readonly EmailService _emailService;

    public PagosController(ChostitoDbContext context, EmailService emailService)
    {
        _context = context;
        _emailService = emailService;
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

        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario != null)
        {
            var entradasHtml = string.Join("", pago.Reserva!.Entradas!.Select(e =>
                $@"
                <div style='background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #6C47FF;'>
                  <p style='margin: 0; font-weight: bold; color: #1a1a2e;'>{(e.Evento?.Titulo ?? "Evento")}</p>
                  <p style='margin: 5px 0 0; font-size: 14px; color: #666;'>Tipo: {e.Tipo} | Asiento: {e.NumeroAsiento ?? "N/A"}</p>
                  <p style='margin: 5px 0 0; font-size: 12px; color: #888;'>QR: {e.CodigoQR}</p>
                </div>"));

            var htmlBody = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;'>
                <div style='background: #1a1a2e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;'>
                    <h1 style='color: white; margin: 0;'>CHOSTITO</h1>
                    <p style='color: #9F7AFF; margin: 5px 0 0;'>Factura Electrónica</p>
                </div>
                <div style='padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;'>
                    <h2>¡Gracias por tu compra, {usuario.Nombre}!</h2>
                    <p>Tu pago ha sido procesado exitosamente. Aquí tienes el detalle de tu reserva:</p>
                    
                    <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
                        <tr><td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Transacción:</strong></td> <td style='text-align: right;'>{pago.CodigoTransaccion.Substring(0, 12)}</td></tr>
                        <tr><td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Fecha:</strong></td> <td style='text-align: right;'>{pago.FechaPago:dd/MM/yyyy HH:mm}</td></tr>
                        <tr><td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Método:</strong></td> <td style='text-align: right;'>{pago.MetodoPago}</td></tr>
                        <tr><td style='padding: 8px 0;'><strong>Total Pagado:</strong></td> <td style='text-align: right; font-size: 18px; font-weight: bold; color: #6C47FF;'>Bs {pago.Monto:F2}</td></tr>
                    </table>

                    <h3 style='margin-top: 30px;'>Tus Entradas</h3>
                    {entradasHtml}

                    <p style='margin-top: 30px; font-size: 14px; color: #666; text-align: center;'>
                        Puedes ver tus códigos QR en todo momento ingresando a la sección 'Mis Reservas' en la plataforma de Chostito.
                    </p>
                </div>
            </div>";

            await _emailService.EnviarCorreoAsync(usuario.Email, "Tu Factura - Chostito", htmlBody);
        }
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
