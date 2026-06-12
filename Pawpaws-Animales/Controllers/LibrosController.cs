using Microsoft.AspNetCore.Mvc;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Services;

namespace Pawpaws.Animales.Controllers;

[ApiController]
[Route("api/animales")]
public class AnimalesController : ControllerBase
{
    private readonly IAnimalService _animalService;

    public AnimalesController(IAnimalService animalService)
    {
        _animalService = animalService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _animalService.ObtenerTodosAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var animal = await _animalService.ObtenerPorIdAsync(id);
        if (animal == null)
            return NotFound(new { mensaje = "Animal no encontrado." });

        return Ok(animal);
    }

    [HttpGet("rescatista/{rescatistaId:guid}")]
    public async Task<IActionResult> ObtenerPorRescatista(Guid rescatistaId)
    {
        return Ok(await _animalService.ObtenerPorRescatistaAsync(rescatistaId));
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearAnimalDto dto)
    {
        try
        {
            var animal = await _animalService.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = animal.Id }, animal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, ActualizarAnimalDto dto)
    {
        try
        {
            bool actualizado = await _animalService.ActualizarAsync(id, dto);
            if (!actualizado)
                return NotFound(new { mensaje = "Animal no encontrado." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}