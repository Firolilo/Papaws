namespace Pawpaws.Animales.Security;

public class AuthOptions
{
    public JwtOptions Jwt { get; set; } = new();
    public string PasswordGenerica { get; set; } = string.Empty;
    public List<UsuarioSemilla> Usuarios { get; set; } = new();
}

public class JwtOptions
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "papaws";
    public string Audience { get; set; } = "papaws";
    public int ExpiraMinutos { get; set; } = 480;
}

public class UsuarioSemilla
{
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
}
