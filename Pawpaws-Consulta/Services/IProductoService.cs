using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public interface IProductoService
{
    Task<List<Producto>> ObtenerTodosAsync();
    Task<Producto?> ObtenerPorIdAsync(Guid id);
    Task<Producto> CrearAsync(CrearProductoDto dto);
    Task<bool> ActualizarAsync(Guid id, ActualizarProductoDto dto);
    Task<bool> EstablecerStockAsync(Guid id, int nuevoStock);
    Task<bool> AjustarStockAsync(Guid id, int delta);
    Task<bool> EliminarAsync(Guid id);
}