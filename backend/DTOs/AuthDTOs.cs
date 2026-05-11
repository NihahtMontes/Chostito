namespace Web_Api_Proyecto.DTOs;

public class RegisterRequest
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string Rol { get; set; } = "Cliente";
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? FotoUrl { get; set; }
    public DateTime FechaRegistro { get; set; }
}

public class UploadFotoRequest
{
    public string FotoBase64 { get; set; } = string.Empty;
}

public class SolicitarResetRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NuevaPassword { get; set; } = string.Empty;
}
