namespace Web_Api_Proyecto.Models;

public class Evento
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Eslogan { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public TimeSpan Hora { get; set; }
    public string? ImagenUrl { get; set; }
    public string Estado { get; set; } = "Borrador";
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public int IdCategoria { get; set; }
    public Categoria? Categoria { get; set; }

    public int IdOrganizador { get; set; }
    public Usuario? Organizador { get; set; }

    public int IdLugar { get; set; }
    public Lugar? Lugar { get; set; }

    public ICollection<Entrada>? Entradas { get; set; }
    public ICollection<Favorito>? Favoritos { get; set; }
}
