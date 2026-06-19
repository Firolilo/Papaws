using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Reportes.Security;
using Pawpaws.Reportes.Services;

namespace Pawpaws.Reportes.Controllers;

[ApiController]
[Authorize(Roles = Roles.LecturaGlobal)]
[Route("api/reportes/organizaciones")]
public class OrganizacionesReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public OrganizacionesReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    /// <summary>C20: Organización con sus rescatistas y los animales de cada uno.</summary>
    [HttpGet("{id:guid}/detalle")]
    public async Task<IActionResult> C20_OrganizacionDetalle(Guid id)
    {
        var resultado = await _reporteService.C20_OrganizacionDetalleAsync(id);
        if (resultado is null)
            return NotFound(new { mensaje = "Organización no encontrada." });
        return Ok(resultado);
    }
}
