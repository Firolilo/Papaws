using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Animales.Security;
using Pawpaws.Animales.Services;

namespace Pawpaws.Animales.Controllers;

[ApiController]
[Authorize(Roles = Roles.SoloAdmin)]
[Route("api/datos-prueba")]
public class DatosPruebaController : ControllerBase
{
    private readonly IDatosPruebaService _datosPruebaService;

    public DatosPruebaController(IDatosPruebaService datosPruebaService)
    {
        _datosPruebaService = datosPruebaService;
    }

    [HttpPost("animales/{cantidad:int}")]
    public async Task<IActionResult> GenerarDatos(int cantidad)
    {
        var resultado = await _datosPruebaService.GenerarDatosAsync(cantidad);
        return Ok(resultado);
    }
}