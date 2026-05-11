using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Data;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsuariosController : ControllerBase
{
    private readonly ChostitoDbContext _context;

    public UsuariosController(ChostitoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var usuarios = await _context.Usuarios
            .OrderBy(u => u.Nombre)
            .Select(u => new
            {
                u.Id,
                u.Nombre,
                u.Email,
                u.Telefono,
                u.Rol,
                u.FotoUrl,
                u.FechaRegistro
            })
            .ToListAsync();

        return Ok(usuarios);
    }
}
