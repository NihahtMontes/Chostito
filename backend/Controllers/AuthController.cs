using Microsoft.AspNetCore.Mvc;
using Web_Api_Proyecto.DTOs;
using Web_Api_Proyecto.Services;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
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
}
