using Cassandra;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public class ProductoService : IProductoService
{
    private readonly Cassandra.ISession _session;
    private readonly PreparedStatement _insertStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByIdStatement;
    private readonly PreparedStatement _updateStockStatement;

    public ProductoService(Cassandra.ISession session)
    {
        _session = session;
        _insertStatement = _session.Prepare("INSERT INTO productos_by_id (id, nombre, tipo, unidad_medida, stock_disponible) VALUES (?, ?, ?, ?, ?)");
        _selectAllStatement = _session.Prepare("SELECT id, nombre, tipo, unidad_medida, stock_disponible FROM productos_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre, tipo, unidad_medida, stock_disponible FROM productos_by_id WHERE id = ?");
        _updateStockStatement = _session.Prepare("UPDATE productos_by_id SET stock_disponible = ? WHERE id = ?");
    }

    public async Task<List<Producto>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        return rows.Select(Mapear).OrderBy(producto => producto.Nombre).ToList();
    }

    public async Task<Producto?> ObtenerPorIdAsync(Guid id)
    {
        var rows = await _session.ExecuteAsync(_selectByIdStatement.Bind(id));
        return rows.FirstOrDefault() is Row row ? Mapear(row) : null;
    }

    public async Task<Producto> CrearAsync(CrearProductoDto dto)
    {
        var producto = new Producto
        {
            Id = Guid.NewGuid(),
            Nombre = dto.Nombre,
            Tipo = dto.Tipo,
            UnidadMedida = dto.UnidadMedida,
            StockDisponible = dto.StockDisponible
        };

        await _session.ExecuteAsync(_insertStatement.Bind(producto.Id, producto.Nombre, producto.Tipo, producto.UnidadMedida, producto.StockDisponible));
        return producto;
    }

    public async Task<bool> AjustarStockAsync(Guid id, int delta)
    {
        var producto = await ObtenerPorIdAsync(id);
        if (producto is null)
        {
            return false;
        }

        var nuevoStock = producto.StockDisponible + delta;
        if (nuevoStock < 0)
        {
            throw new InvalidOperationException($"El stock del producto {producto.Nombre} no puede quedar negativo.");
        }

        await _session.ExecuteAsync(_updateStockStatement.Bind(nuevoStock, id));
        return true;
    }

    private static Producto Mapear(Row row)
    {
        return new Producto
        {
            Id = row.GetValue<Guid>("id"),
            Nombre = row.GetValue<string>("nombre"),
            Tipo = row.GetValue<string>("tipo"),
            UnidadMedida = row.GetValue<string>("unidad_medida"),
            StockDisponible = row.GetValue<int>("stock_disponible")
        };
    }
}