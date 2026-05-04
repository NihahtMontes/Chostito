namespace Web_Api_Proyecto.DTOs;

public class SimularPagoRequest
{
    public string MetodoPago { get; set; } = "QR";
}

public class EscanearQRRequest
{
    public string CodigoQR { get; set; } = string.Empty;
}

public class DashboardStatsDTO
{
    public int TotalEventos { get; set; }
    public int TotalReservas { get; set; }
    public decimal TotalRecaudado { get; set; }
    public int TotalUsuarios { get; set; }
    public int EntradasVendidas { get; set; }
}
