using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Data;
using Web_Api_Proyecto.DTOs;
using Web_Api_Proyecto.Services;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ChostitoDbContext _context;
    private readonly IWebHostEnvironment _env;

    public AuthController(AuthService authService, ChostitoDbContext context, IWebHostEnvironment env)
    {
        _authService = authService;
        _context = context;
        _env = env;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Email y password son requeridos" });

        if (request.Password.Length < 6)
            return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres" });

        var result = await _authService.RegisterAsync(request);
        if (result == null)
            return BadRequest(new { message = "El email ya está registrado" });

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (result == null)
            return Unauthorized(new { message = "Email o contraseña incorrectos" });

        return Ok(result);
    }

    [HttpPost("upload-foto")]
    [Authorize]
    public async Task<IActionResult> UploadFoto([FromBody] UploadFotoRequest request)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario == null) return NotFound(new { message = "Usuario no encontrado" });

        if (string.IsNullOrWhiteSpace(request.FotoBase64))
            return BadRequest(new { message = "No se recibio ninguna imagen" });

        var base64 = request.FotoBase64.Contains(",") ? request.FotoBase64.Split(',')[1] : request.FotoBase64;
        var bytes = Convert.FromBase64String(base64);

        // Mismo manejo que Program.cs para evitar WebRootPath null
        var webRoot = _env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");

        var uploadsFolder = Path.Combine(webRoot, "uploads", "perfiles");
        Directory.CreateDirectory(uploadsFolder);
        var fileName = $"{Guid.NewGuid()}.jpg";
        await System.IO.File.WriteAllBytesAsync(Path.Combine(uploadsFolder, fileName), bytes);

        usuario.FotoUrl = $"/uploads/perfiles/{fileName}";
        await _context.SaveChangesAsync();

        return Ok(new { fotoUrl = usuario.FotoUrl });
    }

    [HttpPost("solicitar-reset")]
    public async Task<IActionResult> SolicitarReset([FromBody] SolicitarResetRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (usuario == null) return Ok(new { message = "Si el email existe, recibiras un token" });

        var token = new Random().Next(100000, 999999).ToString();
        _context.PasswordResetTokens.Add(new Models.PasswordResetToken
        {
            UsuarioId = usuario.Id,
            Token = token,
            Expira = DateTime.UtcNow.AddMinutes(15)
        });
        await _context.SaveChangesAsync();

        var emailService = HttpContext.RequestServices.GetRequiredService<EmailService>();
        await emailService.EnviarCorreoAsync(usuario.Email, "Cambio de contraseña - Chostito",
            $"Tu codigo de verificacion es: {token}\n\nEste codigo expira en 15 minutos.\n\nSi no solicitaste este cambio, ignora este mensaje.");

        return Ok(new { message = "Si el email existe, recibiras un token", token });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (usuario == null) return BadRequest(new { message = "Token invalido o expirado" });

        var resetToken = await _context.PasswordResetTokens
            .Where(t => t.UsuarioId == usuario.Id && t.Token == request.Token && !t.Usado && t.Expira > DateTime.UtcNow)
            .OrderByDescending(t => t.Expira)
            .FirstOrDefaultAsync();

        if (resetToken == null) return BadRequest(new { message = "Token invalido o expirado" });

        if (string.IsNullOrWhiteSpace(request.NuevaPassword) || request.NuevaPassword.Length < 6)
            return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres" });

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaPassword);
        resetToken.Usado = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Contraseña actualizada exitosamente" });
    }
}
