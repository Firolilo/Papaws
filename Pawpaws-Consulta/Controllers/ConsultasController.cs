using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Consulta.Common;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Security;
using Pawpaws.Consulta.Services;

namespace Pawpaws.Consulta.Controllers;

[ApiController]
[Authorize(Roles = Roles.GestionConsultas)]
[Route("api/consultas")]
public class ConsultasController : ControllerBase
{
    private readonly IConsultaService _consultaService;

    public ConsultasController(IConsultaService consultaService)
    {
        _consultaService = consultaService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos([FromQuery] int pagina = 1, [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var consultas = await _consultaService.ObtenerTodosAsync();
        return Ok(consultas.ToResponse().Paginar(pagina, tamano));
    }

    [HttpGet("{codigo}")]
    public async Task<IActionResult> ObtenerPorCodigo(string codigo)
    {
        var consulta = await _consultaService.ObtenerPorCodigoAsync(codigo);
        if (consulta is null)
            return NotFound(new { mensaje = "Consulta no encontrada." });

        return Ok(consulta.ToResponse());
    }

    [HttpGet("animal/{animalId:guid}")]
    public async Task<IActionResult> ObtenerPorAnimal(Guid animalId)
    {
        var consultas = await _consultaService.ObtenerPorAnimalAsync(animalId);
        return Ok(consultas.ToResponse());
    }

    [HttpGet("veterinario/{veterinarioId:guid}")]
    public async Task<IActionResult> ObtenerPorVeterinario(Guid veterinarioId)
    {
        var consultas = await _consultaService.ObtenerPorVeterinarioAsync(veterinarioId);
        return Ok(consultas.ToResponse());
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearConsultaDto dto)
    {
        var consulta = await _consultaService.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorCodigo), new { codigo = consulta.Codigo }, consulta.ToResponse());
    }

    [HttpPut("{codigo}")]
    public async Task<IActionResult> Actualizar(string codigo, [FromBody] ActualizarConsultaDto dto)
    {
        var actualizado = await _consultaService.ActualizarAsync(codigo, dto);
        if (!actualizado)
            return NotFound(new { mensaje = "Consulta no encontrada." });

        return NoContent();
    }

    [HttpPut("{codigo}/estado")]
    public async Task<IActionResult> CambiarEstado(string codigo, [FromBody] CambiarEstadoConsultaDto dto)
    {
        var actualizado = await _consultaService.CambiarEstadoAsync(codigo, dto.Estado);
        if (!actualizado)
            return NotFound(new { mensaje = "Consulta no encontrada." });

        return NoContent();
    }

    [HttpPut("{codigo}/reprogramar")]
    public async Task<IActionResult> Reprogramar(string codigo, [FromBody] ReprogramarConsultaDto dto)
    {
        var actualizado = await _consultaService.ReprogramarAsync(codigo, dto.FechaHora);
        if (!actualizado)
            return NotFound(new { mensaje = "Consulta no encontrada." });

        return NoContent();
    }

    [HttpPut("{codigo}/observaciones")]
    public async Task<IActionResult> ActualizarObservaciones(string codigo, [FromBody] ActualizarObservacionesDto dto)
    {
        var actualizado = await _consultaService.ActualizarObservacionesAsync(codigo, dto.Observaciones);
        if (!actualizado)
            return NotFound(new { mensaje = "Consulta no encontrada." });

        return NoContent();
    }

    [HttpPut("{codigo}/diagnostico")]
    public async Task<IActionResult> RegistrarDiagnostico(string codigo, [FromBody] RegistrarDiagnosticoDto dto)
    {
        var actualizado = await _consultaService.RegistrarDiagnosticoAsync(codigo, dto.Diagnostico, dto.IndicacionesSeguimiento);
        if (!actualizado)
            return NotFound(new { mensaje = "Consulta no encontrada." });

        return NoContent();
    }

    [HttpPost("{codigo}/productos")]
    public async Task<IActionResult> RegistrarProductos(string codigo, [FromBody] List<ProductoUsadoDto> productos)
    {
        var actualizado = await _consultaService.RegistrarProductosAsync(codigo, productos);
        if (!actualizado)
            return NotFound(new { mensaje = "Consulta no encontrada." });

        return NoContent();
    }

    [HttpGet("{codigo}/productos")]
    public async Task<IActionResult> ObtenerProductosUsados(string codigo)
    {
        var consulta = await _consultaService.ObtenerPorCodigoAsync(codigo);
        if (consulta is null)
            return NotFound(new { mensaje = "Consulta no encontrada." });

        var productos = await _consultaService.ObtenerProductosUsadosAsync(codigo);
        return Ok(productos);
    }

    // Las consultas no se borran físicamente: eliminar = cancelar (preserva el historial clínico).
    [HttpDelete("{codigo}")]
    public async Task<IActionResult> Cancelar(string codigo)
    {
        var cancelado = await _consultaService.CambiarEstadoAsync(codigo, "Cancelada");
        if (!cancelado)
            return NotFound(new { mensaje = "Consulta no encontrada." });

        return NoContent();
    }
}
