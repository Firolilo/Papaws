using Cassandra;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Exceptions;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public class ProductoService : IProductoService
{
    // Reintentos ante contención al ajustar stock con compare-and-set (LWT).
    private const int MaxIntentosStock = 5;

    private readonly Cassandra.ISession _session;
    private readonly PreparedStatement _insertStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByIdStatement;
    private readonly PreparedStatement _updateStatement;
    private readonly PreparedStatement _updateStockStatement;
    private readonly PreparedStatement _compareAndSetStockStatement;
    private readonly PreparedStatement _softDeleteStatement;

    public ProductoService(Cassandra.ISession session)
    {
        _session = session;
        _insertStatement = _session.Prepare("INSERT INTO productos_by_id (id, nombre, tipo, unidad_medida, stock_disponible, fecha_vencimiento, activo) VALUES (?, ?, ?, ?, ?, ?, ?)");
        _selectAllStatement = _session.Prepare("SELECT id, nombre, tipo, unidad_medida, stock_disponible, fecha_vencimiento, activo FROM productos_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre, tipo, unidad_medida, stock_disponible, fecha_vencimiento, activo FROM productos_by_id WHERE id = ?");
        _updateStatement = _session.Prepare("UPDATE productos_by_id SET nombre = ?, tipo = ?, unidad_medida = ?, fecha_vencimiento = ? WHERE id = ?");
        _updateStockStatement = _session.Prepare("UPDATE productos_by_id SET stock_disponible = ? WHERE id = ?");
        // Ajuste condicional: solo aplica si el stock no cambió desde la lectura (anti lost-update).
        _compareAndSetStockStatement = _session.Prepare("UPDATE productos_by_id SET stock_disponible = ? WHERE id = ? IF stock_disponible = ?");
        _softDeleteStatement = _session.Prepare("UPDATE productos_by_id SET activo = false WHERE id = ?");
    }

    public async Task<List<Producto>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        return rows.Select(Mapear)
            .Where(producto => producto.Activo)
            .OrderBy(producto => producto.Nombre)
            .ToList();
    }

    public async Task<Producto?> ObtenerPorIdAsync(Guid id)
    {
        var rows = await _session.ExecuteAsync(_selectByIdStatement.Bind(id));
        return rows.FirstOrDefault() is Row row ? Mapear(row) : null;
    }

    public async Task<Producto> CrearAsync(CrearProductoDto dto)
    {
        await GarantizarNombreUnicoAsync(dto.Nombre, null);

        var producto = new Producto
        {
            Id = Guid.NewGuid(),
            Nombre = dto.Nombre,
            Tipo = dto.Tipo,
            UnidadMedida = dto.UnidadMedida,
            StockDisponible = dto.StockDisponible,
            FechaVencimiento = dto.FechaVencimiento,
            Activo = true
        };

        await _session.ExecuteAsync(_insertStatement.Bind(producto.Id, producto.Nombre, producto.Tipo, producto.UnidadMedida, producto.StockDisponible, producto.FechaVencimiento, producto.Activo));
        return producto;
    }

    // Rechaza nombres repetidos entre productos activos (case-insensitive). Evita los duplicados
    // "a mano" que el seed ya no genera. No considera los dados de baja: su nombre puede reutilizarse.
    private async Task GarantizarNombreUnicoAsync(string nombre, Guid? excluyendoId)
    {
        var activos = await ObtenerTodosAsync();
        var colision = activos.Any(p =>
            p.Id != excluyendoId &&
            p.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase));
        if (colision)
        {
            throw new ConflictoException($"Ya existe un producto activo llamado '{nombre}'.");
        }
    }

    public async Task<bool> ActualizarAsync(Guid id, ActualizarProductoDto dto)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        await GarantizarNombreUnicoAsync(dto.Nombre, id);

        // Solo datos descriptivos: el stock se gestiona por endpoints dedicados.
        await _session.ExecuteAsync(_updateStatement.Bind(dto.Nombre, dto.Tipo, dto.UnidadMedida, dto.FechaVencimiento, id));
        return true;
    }

    public async Task<bool> EstablecerStockAsync(Guid id, int nuevoStock)
    {
        if (nuevoStock < 0)
        {
            throw new InvalidOperationException("El stock no puede ser negativo.");
        }

        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        await _session.ExecuteAsync(_updateStockStatement.Bind(nuevoStock, id));
        return true;
    }

    public async Task<bool> AjustarStockAsync(Guid id, int delta)
    {
        var producto = await ObtenerPorIdAsync(id);
        if (producto is null)
        {
            return false;
        }

        // Compare-and-set con LWT: el ajuste solo se aplica si el stock no cambió desde que lo
        // leímos. Sin esto, dos consultas concurrentes que descuentan stock pisarían el valor
        // de la otra (lost update) y el inventario quedaría inflado. Ante colisión reintentamos
        // sobre el valor vigente, que Cassandra devuelve en la fila del LWT fallido.
        var stockActual = producto.StockDisponible;
        for (var intento = 0; intento < MaxIntentosStock; intento++)
        {
            var nuevoStock = stockActual + delta;
            if (nuevoStock < 0)
            {
                throw new InvalidOperationException($"El stock del producto {producto.Nombre} no puede quedar negativo.");
            }

            var resultado = await _session.ExecuteAsync(_compareAndSetStockStatement.Bind(nuevoStock, id, stockActual));
            var fila = resultado.First();
            if (fila.GetValue<bool>("[applied]"))
            {
                return true;
            }

            // Otro proceso modificó el stock entremedio: tomamos el valor real y reintentamos.
            stockActual = fila.GetValue<int>("stock_disponible");
        }

        throw new ConflictoException($"No se pudo ajustar el stock de '{producto.Nombre}' por contención concurrente. Intente nuevamente.");
    }

    public async Task<bool> EliminarAsync(Guid id)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        // Borrado lógico: conserva la fila para no romper referencias de consultas históricas.
        await _session.ExecuteAsync(_softDeleteStatement.Bind(id));
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
            StockDisponible = row.GetValue<int>("stock_disponible"),
            FechaVencimiento = row.IsNull("fecha_vencimiento") ? null : row.GetValue<DateTime>("fecha_vencimiento"),
            Activo = row.IsNull("activo") || row.GetValue<bool>("activo")
        };
    }
}
