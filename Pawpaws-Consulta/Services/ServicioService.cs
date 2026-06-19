using Cassandra;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Exceptions;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public class ServicioService : IServicioService
{
    private readonly Cassandra.ISession _session;
    private readonly PreparedStatement _insertStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByIdStatement;
    private readonly PreparedStatement _updateStatement;
    private readonly PreparedStatement _softDeleteStatement;

    public ServicioService(Cassandra.ISession session)
    {
        _session = session;
        _insertStatement = _session.Prepare("INSERT INTO servicios_by_id (id, nombre, descripcion, duracion_estimadaminutos, precio_base, activo) VALUES (?, ?, ?, ?, ?, ?)");
        _selectAllStatement = _session.Prepare("SELECT id, nombre, descripcion, duracion_estimadaminutos, precio_base, activo FROM servicios_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre, descripcion, duracion_estimadaminutos, precio_base, activo FROM servicios_by_id WHERE id = ?");
        _updateStatement = _session.Prepare("UPDATE servicios_by_id SET nombre = ?, descripcion = ?, duracion_estimadaminutos = ?, precio_base = ? WHERE id = ?");
        _softDeleteStatement = _session.Prepare("UPDATE servicios_by_id SET activo = false WHERE id = ?");
    }

    public async Task<List<Servicio>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        return rows.Select(Mapear)
            .Where(servicio => servicio.Activo)
            .OrderBy(servicio => servicio.Nombre)
            .ToList();
    }

    public async Task<Servicio?> ObtenerPorIdAsync(Guid id)
    {
        var rows = await _session.ExecuteAsync(_selectByIdStatement.Bind(id));
        return rows.FirstOrDefault() is Row row ? Mapear(row) : null;
    }

    public async Task<Servicio> CrearAsync(CrearServicioDto dto)
    {
        await GarantizarNombreUnicoAsync(dto.Nombre, null);

        var servicio = new Servicio
        {
            Id = Guid.NewGuid(),
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            DuracionEstimadaMinutos = dto.DuracionEstimadaMinutos,
            PrecioBase = dto.PrecioBase,
            Activo = true
        };

        await _session.ExecuteAsync(_insertStatement.Bind(servicio.Id, servicio.Nombre, servicio.Descripcion, servicio.DuracionEstimadaMinutos, servicio.PrecioBase, servicio.Activo));
        return servicio;
    }

    public async Task<bool> ActualizarAsync(Guid id, ActualizarServicioDto dto)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        await GarantizarNombreUnicoAsync(dto.Nombre, id);

        await _session.ExecuteAsync(_updateStatement.Bind(dto.Nombre, dto.Descripcion, dto.DuracionEstimadaMinutos, dto.PrecioBase, id));
        return true;
    }

    // Rechaza nombres repetidos entre servicios activos (case-insensitive). Los dados de baja
    // no cuentan: su nombre puede reutilizarse.
    private async Task GarantizarNombreUnicoAsync(string nombre, Guid? excluyendoId)
    {
        var activos = await ObtenerTodosAsync();
        var colision = activos.Any(s =>
            s.Id != excluyendoId &&
            s.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase));
        if (colision)
        {
            throw new ConflictoException($"Ya existe un servicio activo llamado '{nombre}'.");
        }
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

    private static Servicio Mapear(Row row)
    {
        return new Servicio
        {
            Id = row.GetValue<Guid>("id"),
            Nombre = row.GetValue<string>("nombre"),
            Descripcion = row.GetValue<string>("descripcion"),
            DuracionEstimadaMinutos = row.GetValue<int>("duracion_estimadaminutos"),
            PrecioBase = row.GetValue<decimal>("precio_base"),
            Activo = row.IsNull("activo") || row.GetValue<bool>("activo")
        };
    }
}
