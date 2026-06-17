using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Animales.Common;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Security;
using Pawpaws.Animales.Services;

namespace Pawpaws.Animales.Controllers;

[ApiController]
[Authorize]
[Route("api/rescatistas")]
public class RescatistasController : ControllerBase
{
    private readonly IRescatistaService _rescatistaService;

    public RescatistasController(IRescatistaService rescatistaService)
    {
        _rescatistaService = rescatistaService;
    }

    [Authorize(Roles = Roles.LecturaAnimales)]
    [HttpGet]
    public async Task<IActionResult> ObtenerTodos([FromQuery] int pagina = 1, [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var rescatistas = await _rescatistaService.ObtenerTodosAsync();
        return Ok(rescatistas.ToResponse().Paginar(pagina, tamano));
    }

    [Authorize(Roles = Roles.LecturaAnimales)]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var rescatista = await _rescatistaService.ObtenerPorIdAsync(id);
        if (rescatista is null)
            return NotFound(new { mensaje = "Rescatista no encontrado." });

        return Ok(rescatista.ToResponse());
    }

    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpPost]
    public async Task<IActionResult> Crear(CrearRescatistaDto dto)
    {
        var rescatista = await _rescatistaService.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = rescatista.Id }, rescatista.ToResponse());
    }

    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, ActualizarRescatistaDto dto)
    {
        var actualizado = await _rescatistaService.ActualizarAsync(id, dto);
        if (!actualizado)
            return NotFound(new { mensaje = "Rescatista no encontrado." });

        return NoContent();
    }

    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        var eliminado = await _rescatistaService.EliminarAsync(id);
        if (!eliminado)
            return NotFound(new { mensaje = "Rescatista no encontrado." });

        return NoContent();
    }
}
