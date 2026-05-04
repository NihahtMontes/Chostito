namespace Web_Api_Proyecto.Models;

public class Favorito
{
    public int Id { get; set; }
    public DateTime FechaAgregado { get; set; } = DateTime.UtcNow;

    public int IdUsuario { get; set; }
    public Usuario? Usuario { get; set; }

    public int IdEvento { get; set; }
    public Evento? Evento { get; set; }
}
