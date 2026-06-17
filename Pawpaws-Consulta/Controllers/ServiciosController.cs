using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Consulta.Common;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Security;
using Pawpaws.Consulta.Services;

namespace Pawpaws.Consulta.Controllers;

[ApiController]
[Authorize(Roles = Roles.GestionConsultas)]
[Route("api/servicios")]
public class ServiciosController : ControllerBase
{
    private readonly IServicioService _servicioService;
    private readonly IConsultaService _consultaService;

    public ServiciosController(IServicioService servicioService, IConsultaService consultaService)
    {
        _servicioService = servicioService;
        _consultaService = consultaService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos([FromQuery] int pagina = 1, [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var servicios = await _servicioService.ObtenerTodosAsync();
        return Ok(servicios.ToResponse().Paginar(pagina, tamano));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var servicio = await _servicioService.ObtenerPorIdAsync(id);
        if (servicio is null)
            return NotFound(new { mensaje = "Servicio no encontrado." });

        return Ok(servicio.ToResponse());
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearServicioDto dto)
    {
        var servicio = await _servicioService.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = servicio.Id }, servicio.ToResponse());
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, ActualizarServicioDto dto)
    {
        var actualizado = await _servicioService.ActualizarAsync(id, dto);
        if (!actualizado)
            return NotFound(new { mensaje = "Servicio no encontrado." });

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        // Cascada: las consultas que usan el servicio se eliminan antes de darlo de baja.
        await _consultaService.EliminarPorServicioAsync(id);

        var eliminado = await _servicioService.EliminarAsync(id);
        if (!eliminado)
            return NotFound(new { mensaje = "Servicio no encontrado." });

        return NoContent();
    }
}
