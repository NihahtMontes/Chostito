namespace Web_Api_Proyecto.Models;

public class Lugar
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string Pais { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public string Ambiente { get; set; } = string.Empty;
    public int CapacidadTotal { get; set; }
    public string? ImagenUrl { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }

    public ICollection<Evento>? Eventos { get; set; }
}
