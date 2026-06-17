using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Reportes.Security;
using Pawpaws.Reportes.Services;

namespace Pawpaws.Reportes.Controllers;

[ApiController]
[Authorize(Roles = Roles.LecturaGlobal)]
[Route("api/reportes/servicios")]
public class ServiciosReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public ServiciosReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    /// <summary>C11: Obtener información de un servicio por su ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> C11_ServicioPorId(Guid id)
    {
        var resultado = await _reporteService.C11_ServicioPorIdAsync(id);
        if (resultado is null)
            return NotFound(new { mensaje = "Servicio no encontrado." });
        return Ok(resultado);
    }
}
