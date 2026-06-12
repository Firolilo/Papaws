using Microsoft.AspNetCore.Mvc;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Services;

namespace Pawpaws.Consulta.Controllers;

[ApiController]
[Route("api/consultas")]
public class ConsultasController : ControllerBase
{
    private readonly IConsultaService _consultaService;

    public ConsultasController(IConsultaService consultaService)
    {
        _consultaService = consultaService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _consultaService.ObtenerTodosAsync());
    }

    [HttpGet("{codigo}")]
    public async Task<IActionResult> ObtenerPorCodigo(string codigo)
    {
        var consulta = await _consultaService.ObtenerPorCodigoAsync(codigo);
        if (consulta is null)
            return NotFound(new { mensaje = "Consulta no encontrada." });

        return Ok(consulta);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearConsultaDto dto)
    {
        try
        {
            var consulta = await _consultaService.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorCodigo), new { codigo = consulta.Codigo }, consulta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{codigo}/diagnostico")]
    public async Task<IActionResult> RegistrarDiagnostico(string codigo, [FromBody] RegistrarDiagnosticoDto dto)
    {
        try
        {
            var actualizado = await _consultaService.RegistrarDiagnosticoAsync(codigo, dto.Diagnostico, dto.IndicacionesSeguimiento);
            if (!actualizado)
                return NotFound(new { mensaje = "Consulta no encontrada." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPost("{codigo}/productos")]
    public async Task<IActionResult> RegistrarProductos(string codigo, [FromBody] List<ProductoUsadoDto> productos)
    {
        try
        {
            var actualizado = await _consultaService.RegistrarProductosAsync(codigo, productos);
            if (!actualizado)
                return NotFound(new { mensaje = "Consulta no encontrada." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}

public class RegistrarDiagnosticoDto
{
    public string Diagnostico { get; set; } = string.Empty;
    public string IndicacionesSeguimiento { get; set; } = string.Empty;
}