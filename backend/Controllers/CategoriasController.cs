using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Data;
using Web_Api_Proyecto.Models;

namespace Web_Api_Proyecto.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriasController : ControllerBase
{
    private readonly ChostitoDbContext _context;

    public CategoriasController(ChostitoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Categoria>>> GetAll()
    {
        return await _context.Categorias.OrderBy(c => c.Nombre).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Categoria>> GetById(int id)
    {
        var categoria = await _context.Categorias.FindAsync(id);
        if (categoria == null) return NotFound(new { message = "Categoria no encontrada" });
        return categoria;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<ActionResult<Categoria>> Create(Categoria categoria)
    {
        _context.Categorias.Add(categoria);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = categoria.Id }, categoria);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<IActionResult> Update(int id, Categoria categoria)
    {
        if (id != categoria.Id) return BadRequest();
        _context.Entry(categoria).State = EntityState.Modified;
        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException) { return NotFound(new { message = "Categoria no encontrada" }); }
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Organizador")]
    public async Task<IActionResult> Delete(int id)
    {
        var categoria = await _context.Categorias.FindAsync(id);
        if (categoria == null) return NotFound(new { message = "Categoria no encontrada" });
        _context.Categorias.Remove(categoria);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
