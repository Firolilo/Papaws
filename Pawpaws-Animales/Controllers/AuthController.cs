using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Services;

namespace Pawpaws.Animales.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IJwtService _jwtService;

    public AuthController(IJwtService jwtService)
    {
        _jwtService = jwtService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public IActionResult Login(LoginDto dto)
    {
        var token = _jwtService.Autenticar(dto.Email, dto.Password);
        if (token is null)
            return Unauthorized(new { mensaje = "Credenciales inválidas." });

        return Ok(token);
    }
}
