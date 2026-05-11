namespace Web_Api_Proyecto.DTOs;

public class ReservaCreateDTO
{
    public List<ReservaItemDTO> Items { get; set; } = new();
    public List<int>? IdsEntradas { get; set; }
}

public class ReservaItemDTO
{
    public int IdEvento { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class ReservaResponseDTO
{
    public int Id { get; set; }
    public DateTime FechaReserva { get; set; }
    public decimal Total { get; set; }
    public int CantidadEntradas { get; set; }
    public string Estado { get; set; } = string.Empty;
    public List<EntradaDetalleDTO> Entradas { get; set; } = new();
    public PagoResponseDTO? Pago { get; set; }
}

public class EntradaDetalleDTO
{
    public int Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public string CodigoQR { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string Evento { get; set; } = string.Empty;
    public DateTime FechaEvento { get; set; }
    public string? NumeroAsiento { get; set; }
}

public class PagoResponseDTO
{
    public int Id { get; set; }
    public decimal Monto { get; set; }
    public string MetodoPago { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public DateTime? FechaPago { get; set; }
    public string CodigoTransaccion { get; set; } = string.Empty;
}
