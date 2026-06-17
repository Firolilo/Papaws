using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Reportes.Common;
using Pawpaws.Reportes.Security;
using Pawpaws.Reportes.Services;

namespace Pawpaws.Reportes.Controllers;

[ApiController]
[Authorize(Roles = Roles.LecturaGlobal)]
[Route("api/reportes/productos")]
public class ProductosReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public ProductosReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    /// <summary>C10: Listar el inventario actual de productos ordenados por stock ascendente.</summary>
    [HttpGet("por-stock")]
    public async Task<IActionResult> C10_ProductosPorStock(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var resultado = await _reporteService.C10_ProductosPorStockAsync();
        return Ok(resultado.AsReadOnly().Paginar(pagina, tamano));
    }

    /// <summary>C14: Obtener información de un producto por su ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> C14_ProductoPorId(Guid id)
    {
        var resultado = await _reporteService.C14_ProductoPorIdAsync(id);
        if (resultado is null)
            return NotFound(new { mensaje = "Producto no encontrado." });
        return Ok(resultado);
    }
}
