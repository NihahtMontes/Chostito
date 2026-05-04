namespace Web_Api_Proyecto.Models;

public class Categoria
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }

    public ICollection<Evento>? Eventos { get; set; }
}
