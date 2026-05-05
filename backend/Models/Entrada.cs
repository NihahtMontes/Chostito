namespace Web_Api_Proyecto.Models;

public class Entrada
{
    public int Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public string CodigoQR { get; set; } = Guid.NewGuid().ToString();
    public string Estado { get; set; } = "Activa";

    public int? IdReserva { get; set; }
    public Reserva? Reserva { get; set; }

    public int IdEvento { get; set; }
    public Evento? Evento { get; set; }
}
