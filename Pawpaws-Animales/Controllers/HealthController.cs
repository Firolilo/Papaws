using Microsoft.AspNetCore.Mvc;
using Pawpaws.Animales.Services;

namespace Pawpaws.Animales.Controllers;

[ApiController]
[Route("api/salud")]
public class HealthController : ControllerBase
{
    private readonly IHealthService _healthService;

    public HealthController(IHealthService healthService)
    {
        _healthService = healthService;
    }

    [HttpGet]
    public IActionResult ObtenerEstado()
    {
        return Ok(_healthService.ObtenerEstado());
    }
}