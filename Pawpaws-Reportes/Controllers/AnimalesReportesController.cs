using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Reportes.Common;
using Pawpaws.Reportes.Security;
using Pawpaws.Reportes.Services;

namespace Pawpaws.Reportes.Controllers;

[ApiController]
[Authorize(Roles = Roles.LecturaGlobal)]
[Route("api/reportes/animales")]
public class AnimalesReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public AnimalesReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    /// <summary>C3: Listar todos los animales presentes en el centro filtrados por especie.</summary>
    [HttpGet("especie/{especie}")]
    public async Task<IActionResult> C3_AnimalesPorEspecie(
        string especie,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var resultado = await _reporteService.C3_AnimalesPorEspecieAsync(especie);
        return Ok(resultado.AsReadOnly().Paginar(pagina, tamano));
    }

    /// <summary>C4: Obtener el historial de consultas de un animal, ordenadas de la más reciente a la más antigua.</summary>
    [HttpGet("{animalId:guid}/consultas")]
    public async Task<IActionResult> C4_ConsultasPorAnimal(Guid animalId)
    {
        var resultado = await _reporteService.C4_ConsultasPorAnimalAsync(animalId);
        if (resultado is null)
            return NotFound(new { mensaje = "Animal no encontrado." });
        return Ok(resultado);
    }

    /// <summary>C17: Listar animales por nombre (búsqueda parcial).</summary>
    [HttpGet("nombre/{nombre}")]
    public async Task<IActionResult> C17_AnimalesPorNombre(
        string nombre,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var resultado = await _reporteService.C17_AnimalesPorNombreAsync(nombre);
        return Ok(resultado.AsReadOnly().Paginar(pagina, tamano));
    }
}
