using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Data;
using Web_Api_Proyecto.Models;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LugaresController : ControllerBase
{
    private readonly ChostitoDbContext _context;

    public LugaresController(ChostitoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Lugar>>> GetAll()
    {
        return await _context.Lugares.OrderBy(l => l.Nombre).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Lugar>> GetById(int id)
    {
        var lugar = await _context.Lugares.FindAsync(id);
        if (lugar == null) return NotFound(new { message = "Lugar no encontrado" });
        return lugar;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Lugar>> Create(Lugar lugar)
    {
        _context.Lugares.Add(lugar);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = lugar.Id }, lugar);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, Lugar lugar)
    {
        if (id != lugar.Id) return BadRequest();
        _context.Entry(lugar).State = EntityState.Modified;
        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException) { return NotFound(new { message = "Lugar no encontrado" }); }
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var lugar = await _context.Lugares.FindAsync(id);
        if (lugar == null) return NotFound(new { message = "Lugar no encontrado" });
        _context.Lugares.Remove(lugar);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
