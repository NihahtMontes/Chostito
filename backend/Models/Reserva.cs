namespace Web_Api_Proyecto.Models;

public class Reserva
{
    public int Id { get; set; }
    public DateTime FechaReserva { get; set; } = DateTime.UtcNow;
    public decimal Total { get; set; }
    public int CantidadEntradas { get; set; }
    public string Estado { get; set; } = "Pendiente";

    public int IdUsuario { get; set; }
    public Usuario? Usuario { get; set; }

    public ICollection<Entrada>? Entradas { get; set; }
    public Pago? Pago { get; set; }
}
