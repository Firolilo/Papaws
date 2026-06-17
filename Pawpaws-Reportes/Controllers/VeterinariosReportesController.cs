using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Reportes.Common;
using Pawpaws.Reportes.Security;
using Pawpaws.Reportes.Services;

namespace Pawpaws.Reportes.Controllers;

[ApiController]
[Authorize(Roles = Roles.LecturaGlobal)]
[Route("api/reportes/veterinarios")]
public class VeterinariosReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public VeterinariosReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    /// <summary>C12: Obtener información de un veterinario por su ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> C12_VeterinarioPorId(Guid id)
    {
        var resultado = await _reporteService.C12_VeterinarioPorIdAsync(id);
        if (resultado is null)
            return NotFound(new { mensaje = "Veterinario no encontrado." });
        return Ok(resultado);
    }

    /// <summary>C5: Obtener las consultas por veterinario.</summary>
    [HttpGet("{veterinarioId:guid}/consultas")]
    public async Task<IActionResult> C5_ConsultasPorVeterinario(Guid veterinarioId)
    {
        var resultado = await _reporteService.C5_ConsultasPorVeterinarioAsync(veterinarioId);
        if (resultado is null)
            return NotFound(new { mensaje = "Veterinario no encontrado." });
        return Ok(resultado);
    }

    /// <summary>C13: Listar veterinarios por especialidad.</summary>
    [HttpGet("especialidad/{especialidad}")]
    public async Task<IActionResult> C13_VeterinariosPorEspecialidad(
        string especialidad,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var resultado = await _reporteService.C13_VeterinariosPorEspecialidadAsync(especialidad);
        return Ok(resultado.AsReadOnly().Paginar(pagina, tamano));
    }
}
