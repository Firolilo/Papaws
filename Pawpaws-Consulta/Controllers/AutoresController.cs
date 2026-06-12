using Microsoft.AspNetCore.Mvc;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Services;

namespace Pawpaws.Consulta.Controllers;

[ApiController]
[Route("api/veterinarios")]
public class VeterinariosController : ControllerBase
{
    private readonly IVeterinarioService _veterinarioService;

    public VeterinariosController(IVeterinarioService veterinarioService)
    {
        _veterinarioService = veterinarioService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _veterinarioService.ObtenerTodosAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var veterinario = await _veterinarioService.ObtenerPorIdAsync(id);
        if (veterinario is null)
            return NotFound(new { mensaje = "Veterinario no encontrado." });

        return Ok(veterinario);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearVeterinarioDto dto)
    {
        var veterinario = await _veterinarioService.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = veterinario.Id }, veterinario);
    }
}