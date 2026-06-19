using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Animales.Common;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Security;
using Pawpaws.Animales.Services;

namespace Pawpaws.Animales.Controllers;

[ApiController]
[Authorize]
[Route("api/organizaciones")]
public class OrganizacionesController : ControllerBase
{
    private readonly IOrganizacionService _organizacionService;

    public OrganizacionesController(IOrganizacionService organizacionService)
    {
        _organizacionService = organizacionService;
    }

    [Authorize(Roles = Roles.LecturaAnimales)]
    [HttpGet]
    public async Task<IActionResult> ObtenerTodos([FromQuery] int pagina = 1, [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var organizaciones = await _organizacionService.ObtenerTodosAsync();
        return Ok(organizaciones.ToResponse().Paginar(pagina, tamano));
    }

    [Authorize(Roles = Roles.LecturaAnimales)]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var organizacion = await _organizacionService.ObtenerPorIdAsync(id);
        if (organizacion is null)
            return NotFound(new { mensaje = "Organización no encontrada." });

        return Ok(organizacion.ToResponse());
    }

    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpPost]
    public async Task<IActionResult> Crear(CrearOrganizacionDto dto)
    {
        var organizacion = await _organizacionService.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = organizacion.Id }, organizacion.ToResponse());
    }

    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, ActualizarOrganizacionDto dto)
    {
        var actualizado = await _organizacionService.ActualizarAsync(id, dto);
        if (!actualizado)
            return NotFound(new { mensaje = "Organización no encontrada." });

        return NoContent();
    }

    [Authorize(Roles = Roles.GestionAnimales)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        var eliminado = await _organizacionService.EliminarAsync(id);
        if (!eliminado)
            return NotFound(new { mensaje = "Organización no encontrada." });

        return NoContent();
    }
}
