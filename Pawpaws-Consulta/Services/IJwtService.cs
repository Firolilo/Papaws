using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public interface IProductoService
{
    Task<List<Producto>> ObtenerTodosAsync();
    Task<Producto?> ObtenerPorIdAsync(Guid id);
    Task<Producto> CrearAsync(CrearProductoDto dto);
    Task<bool> AjustarStockAsync(Guid id, int delta);
}