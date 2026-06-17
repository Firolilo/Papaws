using Microsoft.AspNetCore.Mvc;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Services;

namespace Pawpaws.Animales.Controllers;

[ApiController]
[Route("api/rescatistas")]
public class RescatistasController : ControllerBase
{
    private readonly IRescatistaService _rescatistaService;

    public RescatistasController(IRescatistaService rescatistaService)
    {
        _rescatistaService = rescatistaService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _rescatistaService.ObtenerTodosAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var rescatista = await _rescatistaService.ObtenerPorIdAsync(id);
        if (rescatista == null)
            return NotFound(new { mensaje = "Rescatista no encontrado." });

        return Ok(rescatista);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearRescatistaDto dto)
    {
        var rescatista = await _rescatistaService.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = rescatista.Id }, rescatista);
    }
}