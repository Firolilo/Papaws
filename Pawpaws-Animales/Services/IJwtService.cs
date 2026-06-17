using Pawpaws.Animales.DTOs;

namespace Pawpaws.Animales.Services;

public interface IJwtService
{
    /// <summary>Valida email + contraseña y devuelve el token, o null si las credenciales no son válidas.</summary>
    TokenResponseDto? Autenticar(string email, string password);
}
