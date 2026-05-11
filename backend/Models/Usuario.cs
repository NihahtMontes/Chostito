namespace Web_Api_Proyecto.Models;

public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string Rol { get; set; } = "Cliente";
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public string? FotoUrl { get; set; }

    public ICollection<Evento>? EventosOrganizados { get; set; }
    public ICollection<Reserva>? Reservas { get; set; }
    public ICollection<Favorito>? Favoritos { get; set; }
}
