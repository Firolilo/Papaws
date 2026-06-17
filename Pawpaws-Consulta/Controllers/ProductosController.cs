using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Consulta.Common;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Security;
using Pawpaws.Consulta.Services;

namespace Pawpaws.Consulta.Controllers;

[ApiController]
[Authorize(Roles = Roles.GestionConsultas)]
[Route("api/productos")]
public class ProductosController : ControllerBase
{
    private readonly IProductoService _productoService;

    public ProductosController(IProductoService productoService)
    {
        _productoService = productoService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos([FromQuery] int pagina = 1, [FromQuery] int tamano = Paginacion.TamanoPorDefecto)
    {
        var productos = await _productoService.ObtenerTodosAsync();
        return Ok(productos.ToResponse().Paginar(pagina, tamano));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var producto = await _productoService.ObtenerPorIdAsync(id);
        if (producto is null)
            return NotFound(new { mensaje = "Producto no encontrado." });

        return Ok(producto.ToResponse());
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearProductoDto dto)
    {
        var producto = await _productoService.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = producto.Id }, producto.ToResponse());
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, ActualizarProductoDto dto)
    {
        var actualizado = await _productoService.ActualizarAsync(id, dto);
        if (!actualizado)
            return NotFound(new { mensaje = "Producto no encontrado." });

        return NoContent();
    }

    [HttpPut("{id:guid}/stock")]
    public async Task<IActionResult> EstablecerStock(Guid id, EstablecerStockDto dto)
    {
        var actualizado = await _productoService.EstablecerStockAsync(id, dto.StockDisponible);
        if (!actualizado)
            return NotFound(new { mensaje = "Producto no encontrado." });

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        var eliminado = await _productoService.EliminarAsync(id);
        if (!eliminado)
            return NotFound(new { mensaje = "Producto no encontrado." });

        return NoContent();
    }
}
