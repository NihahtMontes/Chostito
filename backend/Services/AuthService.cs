using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Web_Api_Proyecto.Data;
using Web_Api_Proyecto.DTOs;
using Web_Api_Proyecto.Models;

namespace Web_Api_Proyecto.Services;

public class AuthService
{
    private readonly ChostitoDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(ChostitoDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        if (await _context.Usuarios.AnyAsync(u => u.Email == request.Email))
            return null;

        var usuario = new Usuario
        {
            Nombre = request.Nombre,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Telefono = request.Telefono,
            Rol = request.Rol
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return new AuthResponse
        {
            Token = GenerateToken(usuario),
            Id = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email,
            Rol = usuario.Rol,
            Telefono = usuario.Telefono,
            FotoUrl = usuario.FotoUrl,
            FechaRegistro = usuario.FechaRegistro
        };
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            return null;

        return new AuthResponse
        {
            Token = GenerateToken(usuario),
            Id = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email,
            Rol = usuario.Rol,
            Telefono = usuario.Telefono,
            FotoUrl = usuario.FotoUrl,
            FechaRegistro = usuario.FechaRegistro
        };
    }

    private string GenerateToken(Usuario usuario)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Name, usuario.Nombre),
            new Claim(ClaimTypes.Role, usuario.Rol)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
