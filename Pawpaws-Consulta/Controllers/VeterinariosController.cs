using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Consulta.Common;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Security;
using Pawpaws.Consulta.Services;

namespace Pawpaws.Consulta.Controllers;

[ApiController]
[Authorize(Roles = Roles.GestionConsultas)]
[Route("api/veterinarios")]
public class VeterinariosController : ControllerBase
{
    private readonly IVeterinarioService _veterinarioService;
    private readonly IConsultaService _consultaService;

    public VeterinariosController(IVeterinarioService veterinarioService, IConsultaService consultaService)
    {
        _veterinarioService = veterinarioService;
        _consultaService = consultaService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos([FromQuery] int pagina = 1, [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var veterinarios = await _veterinarioService.ObtenerTodosAsync();
        return Ok(veterinarios.ToResponse().Paginar(pagina, tamano));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var veterinario = await _veterinarioService.ObtenerPorIdAsync(id);
        if (veterinario is null)
            return NotFound(new { mensaje = "Veterinario no encontrado." });

        return Ok(veterinario.ToResponse());
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearVeterinarioDto dto)
    {
        var veterinario = await _veterinarioService.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = veterinario.Id }, veterinario.ToResponse());
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, ActualizarVeterinarioDto dto)
    {
        var actualizado = await _veterinarioService.ActualizarAsync(id, dto);
        if (!actualizado)
            return NotFound(new { mensaje = "Veterinario no encontrado." });

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        // Cascada: las consultas del veterinario se eliminan antes de darlo de baja.
        await _consultaService.EliminarPorVeterinarioAsync(id);

        var eliminado = await _veterinarioService.EliminarAsync(id);
        if (!eliminado)
            return NotFound(new { mensaje = "Veterinario no encontrado." });

        return NoContent();
    }
}
