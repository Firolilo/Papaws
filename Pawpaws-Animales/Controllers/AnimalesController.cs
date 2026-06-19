using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Animales.Common;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Security;
using Pawpaws.Animales.Services;

namespace Pawpaws.Animales.Controllers;

[ApiController]
[Authorize]
[Route("api/animales")]
public class AnimalesController : ControllerBase
{
    private readonly IAnimalService _animalService;

    public AnimalesController(IAnimalService animalService)
    {
        _animalService = animalService;
    }

    [Authorize(Roles = Roles.LecturaAnimales)]
    [HttpGet]
    public async Task<IActionResult> ObtenerTodos([FromQuery] int pagina = 1, [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var animales = await _animalService.ObtenerTodosAsync();
        return Ok(animales.ToResponse().Paginar(pagina, tamano));
    }

    [Authorize(Roles = Roles.LecturaAnimales)]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var animal = await _animalService.ObtenerPorIdAsync(id);
        if (animal is null)
            return NotFound(new { mensaje = "Animal no encontrado." });

        return Ok(animal.ToResponse());
    }

    [Authorize(Roles = Roles.LecturaAnimales)]
    [HttpGet("rescatista/{rescatistaId:guid}")]
    public async Task<IActionResult> ObtenerPorRescatista(Guid rescatistaId)
    {
        var animales = await _animalService.ObtenerPorRescatistaAsync(rescatistaId);
        return Ok(animales.ToResponse());
    }

    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpPost]
    public async Task<IActionResult> Crear(CrearAnimalDto dto)
    {
        var animal = await _animalService.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = animal.Id }, animal.ToResponse());
    }

    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, ActualizarAnimalDto dto)
    {
        var actualizado = await _animalService.ActualizarAsync(id, dto);
        if (!actualizado)
            return NotFound(new { mensaje = "Animal no encontrado." });

        return NoContent();
    }

    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpPut("{id:guid}/estado")]
    public async Task<IActionResult> CambiarEstado(Guid id, CambiarEstadoAnimalDto dto)
    {
        var actualizado = await _animalService.RegistrarEstadoAsync(id, dto.Estado, dto.FechaSalida, dto.AdoptanteRescatistaId, dto.Nota);
        if (!actualizado)
            return NotFound(new { mensaje = "Animal no encontrado." });

        return NoContent();
    }

    [Authorize(Roles = Roles.LecturaAnimales)]
    [HttpGet("{id:guid}/adopciones")]
    public async Task<IActionResult> ObtenerHistorialAdopciones(Guid id)
    {
        var eventos = await _animalService.ObtenerEventosAdopcionAsync(id);
        return Ok(eventos.ToResponse());
    }

    [Authorize(Roles = Roles.LecturaAnimales)]
    [HttpGet("{id:guid}/custodia")]
    public async Task<IActionResult> ObtenerHistorialCustodia(Guid id)
    {
        var eventos = await _animalService.ObtenerEventosCustodiaAsync(id);
        return Ok(eventos.ToResponse());
    }

    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        var eliminado = await _animalService.EliminarAsync(id);
        if (!eliminado)
            return NotFound(new { mensaje = "Animal no encontrado." });

        return NoContent();
    }
}
