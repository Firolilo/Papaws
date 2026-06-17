using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Reportes.Common;
using Pawpaws.Reportes.Security;
using Pawpaws.Reportes.Services;

namespace Pawpaws.Reportes.Controllers;

[ApiController]
[Authorize(Roles = Roles.LecturaGlobal)]
[Route("api/reportes/consultas")]
public class ConsultasReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public ConsultasReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    /// <summary>C15: Obtener datos básicos de una consulta por su código.</summary>
    [HttpGet("{codigo}")]
    public async Task<IActionResult> C15_ConsultaPorCodigo(string codigo)
    {
        var resultado = await _reporteService.C15_ConsultaPorCodigoAsync(codigo);
        if (resultado is null)
            return NotFound(new { mensaje = "Consulta no encontrada." });
        return Ok(resultado);
    }

    /// <summary>C6: Obtener el detalle completo de una consulta por su código.</summary>
    [HttpGet("{codigo}/detalle")]
    public async Task<IActionResult> C6_DetalleConsulta(string codigo)
    {
        var resultado = await _reporteService.C6_DetalleConsultaAsync(codigo);
        if (resultado is null)
            return NotFound(new { mensaje = "Consulta no encontrada." });
        return Ok(resultado);
    }

    /// <summary>C8: Listar todos los servicios incluidos en una consulta particular.</summary>
    [HttpGet("{codigo}/servicios")]
    public async Task<IActionResult> C8_ServiciosPorConsulta(string codigo)
    {
        var resultado = await _reporteService.C8_ServiciosPorConsultaAsync(codigo);
        return Ok(resultado);
    }

    /// <summary>C9: Obtener todos los productos usados en una consulta.</summary>
    [HttpGet("{codigo}/productos")]
    public async Task<IActionResult> C9_ProductosPorConsulta(string codigo)
    {
        var resultado = await _reporteService.C9_ProductosPorConsultaAsync(codigo);
        return Ok(resultado);
    }

    /// <summary>C7: Listar las consultas por su estado actual.</summary>
    [HttpGet("por-estado/{estado}")]
    public async Task<IActionResult> C7_ConsultasPorEstado(
        string estado,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var resultado = await _reporteService.C7_ConsultasPorEstadoAsync(estado);
        return Ok(resultado.AsReadOnly().Paginar(pagina, tamano));
    }

    /// <summary>C16: Listar consultas por fecha.</summary>
    [HttpGet("por-fecha/{fecha}")]
    public async Task<IActionResult> C16_ConsultasPorFecha(
        DateOnly fecha,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var resultado = await _reporteService.C16_ConsultasPorFechaAsync(fecha);
        return Ok(resultado.AsReadOnly().Paginar(pagina, tamano));
    }
}
