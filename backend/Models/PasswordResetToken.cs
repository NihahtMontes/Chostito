namespace Web_Api_Proyecto.Models;

public class PasswordResetToken
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime Expira { get; set; }
    public bool Usado { get; set; }
}
