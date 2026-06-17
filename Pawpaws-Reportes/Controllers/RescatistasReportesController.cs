using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Reportes.Common;
using Pawpaws.Reportes.Security;
using Pawpaws.Reportes.Services;

namespace Pawpaws.Reportes.Controllers;

[ApiController]
[Authorize(Roles = Roles.LecturaGlobal)]
[Route("api/reportes/rescatistas")]
public class RescatistasReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public RescatistasReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    /// <summary>C1: Obtener información del rescatista por su ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> C1_RescatistaPorId(Guid id)
    {
        var resultado = await _reporteService.C1_RescatistaPorIdAsync(id);
        if (resultado is null)
            return NotFound(new { mensaje = "Rescatista no encontrado." });
        return Ok(resultado);
    }

    /// <summary>C2: Listar todos los animales ingresados por un rescatista específico.</summary>
    [HttpGet("{rescatistaId:guid}/animales")]
    public async Task<IActionResult> C2_AnimalesPorRescatista(Guid rescatistaId)
    {
        var resultado = await _reporteService.C2_AnimalesPorRescatistaAsync(rescatistaId);
        if (resultado is null)
            return NotFound(new { mensaje = "Rescatista no encontrado." });
        return Ok(resultado);
    }

    /// <summary>C19: Listar rescatistas por zona de operación.</summary>
    [HttpGet("zona/{zona}")]
    public async Task<IActionResult> C19_RescatistasPorZona(
        string zona,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var resultado = await _reporteService.C19_RescatistasPorZonaAsync(zona);
        return Ok(resultado.AsReadOnly().Paginar(pagina, tamano));
    }
}
