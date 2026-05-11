using Web_Api_Proyecto.Models;

namespace Web_Api_Proyecto.DTOs;

public class EventoCreateDTO
{
    public string Titulo { get; set; } = string.Empty;
    public string Eslogan { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public TimeSpan Hora { get; set; }
    public int IdCategoria { get; set; }
    public int IdLugar { get; set; }
    public string Estado { get; set; } = "Borrador";
}

public class EventoUpdateDTO
{
    public string? Titulo { get; set; }
    public string? Eslogan { get; set; }
    public string? Descripcion { get; set; }
    public DateTime? Fecha { get; set; }
    public TimeSpan? Hora { get; set; }
    public int? IdCategoria { get; set; }
    public int? IdLugar { get; set; }
    public string? Estado { get; set; }
}

public class EventoResponseDTO
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Eslogan { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public TimeSpan Hora { get; set; }
    public string? ImagenUrl { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Organizador { get; set; } = string.Empty;
    public string Lugar { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public string Pais { get; set; } = string.Empty;
    public decimal PrecioMinimo { get; set; }
}

public class EntradaCreateDTO
{
    public string Tipo { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public int Cantidad { get; set; }
    public string? Seccion { get; set; }
    public int? AsientosPorSeccion { get; set; }
}

public class EntradaResponseDTO
{
    public int Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public int CantidadDisponible { get; set; }
    public int CantidadVendida { get; set; }
    public int CantidadTotal { get; set; }
}

public class AsientoDTO
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}

public class SeccionAsientosDTO
{
    public string Seccion { get; set; } = string.Empty;
    public List<AsientoDTO> Asientos { get; set; } = new();
}
