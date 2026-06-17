using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Security;

namespace Pawpaws.Animales.Services;

public class JwtService : IJwtService
{
    private readonly AuthOptions _options;

    public JwtService(IOptions<AuthOptions> options)
    {
        _options = options.Value;
    }

    public TokenResponseDto? Autenticar(string email, string password)
    {
        var usuario = _options.Usuarios
            .FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));

        // Modelo simple: cualquier usuario semilla con la contraseña genérica única.
        if (usuario is null || password != _options.PasswordGenerica)
        {
            return null;
        }

        var expira = DateTime.UtcNow.AddMinutes(_options.Jwt.ExpiraMinutos);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Rol),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var clave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Jwt.Key));
        var credenciales = new SigningCredentials(clave, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Jwt.Issuer,
            audience: _options.Jwt.Audience,
            claims: claims,
            expires: expira,
            signingCredentials: credenciales);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        return new TokenResponseDto(tokenString, expira, usuario.Email, usuario.Rol);
    }
}
