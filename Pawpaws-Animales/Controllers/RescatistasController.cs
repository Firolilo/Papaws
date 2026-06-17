using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Animales.Common;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Models;
using Pawpaws.Animales.Security;
using Pawpaws.Animales.Services;

namespace Pawpaws.Animales.Controllers;

[ApiController]
[Authorize]
[Route("api/rescatistas")]
public class RescatistasController : ControllerBase
{
    private readonly IRescatistaService _rescatistaService;
    private readonly IAnimalService _animalService;

    public RescatistasController(IRescatistaService rescatistaService, IAnimalService animalService)
    {
        _rescatistaService = rescatistaService;
        _animalService = animalService;
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

    // Al eliminar un rescatista, sus animales se reasignan a otro rescatista (parámetro
    // reasignarA). Si no se indica, van al rescatista interno "Refugio".
    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id, [FromQuery] Guid? reasignarA = null)
    {
        var destinoId = reasignarA ?? Rescatista.RefugioId;

        if (destinoId == id)
            return BadRequest(new { mensaje = "No se puede reasignar los animales al mismo rescatista que se elimina." });

        var destino = await _rescatistaService.ObtenerPorIdAsync(destinoId);
        if (destino is null || !destino.Activo)
            return BadRequest(new { mensaje = "El rescatista destino no existe o está dado de baja." });

        // Primero reasignamos los animales (no pueden quedar sin rescatista), luego damos de baja.
        await _animalService.ReasignarAnimalesAsync(id, destinoId);

        var eliminado = await _rescatistaService.EliminarAsync(id);
        if (!eliminado)
            return NotFound(new { mensaje = "Rescatista no encontrado." });

        return NoContent();
    }
}
