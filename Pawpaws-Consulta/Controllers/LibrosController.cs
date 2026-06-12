using Microsoft.AspNetCore.Mvc;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Services;

namespace Pawpaws.Consulta.Controllers;

[ApiController]
[Route("api/servicios")]
public class ServiciosController : ControllerBase
{
    private readonly IServicioService _servicioService;

    public ServiciosController(IServicioService servicioService)
    {
        _servicioService = servicioService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _servicioService.ObtenerTodosAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var servicio = await _servicioService.ObtenerPorIdAsync(id);
        if (servicio is null)
            return NotFound(new { mensaje = "Servicio no encontrado." });

        return Ok(servicio);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearServicioDto dto)
    {
        var servicio = await _servicioService.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = servicio.Id }, servicio);
    }
}