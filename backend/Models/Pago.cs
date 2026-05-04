namespace Web_Api_Proyecto.Models;

public class Pago
{
    public int Id { get; set; }
    public decimal Monto { get; set; }
    public string MetodoPago { get; set; } = string.Empty;
    public string Estado { get; set; } = "Pendiente";
    public DateTime? FechaPago { get; set; }
    public string CodigoTransaccion { get; set; } = Guid.NewGuid().ToString();

    public int IdReserva { get; set; }
    public Reserva? Reserva { get; set; }
}
