using Cassandra;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public class ServicioService : IServicioService
{
    private readonly Cassandra.ISession _session;
    private readonly PreparedStatement _insertStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByIdStatement;

    public ServicioService(Cassandra.ISession session)
    {
        _session = session;
        _insertStatement = _session.Prepare("INSERT INTO servicios_by_id (id, nombre, descripcion, duracion_estimadaminutos, precio_base) VALUES (?, ?, ?, ?, ?)");
        _selectAllStatement = _session.Prepare("SELECT id, nombre, descripcion, duracion_estimadaminutos, precio_base FROM servicios_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre, descripcion, duracion_estimadaminutos, precio_base FROM servicios_by_id WHERE id = ?");
    }

    public async Task<List<Servicio>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        return rows.Select(Mapear).OrderBy(servicio => servicio.Nombre).ToList();
    }

    public async Task<Servicio?> ObtenerPorIdAsync(Guid id)
    {
        var rows = await _session.ExecuteAsync(_selectByIdStatement.Bind(id));
        return rows.FirstOrDefault() is Row row ? Mapear(row) : null;
    }

    public async Task<Servicio> CrearAsync(CrearServicioDto dto)
    {
        var servicio = new Servicio
        {
            Id = Guid.NewGuid(),
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            DuracionEstimadaMinutos = dto.DuracionEstimadaMinutos,
            PrecioBase = dto.PrecioBase
        };

        await _session.ExecuteAsync(_insertStatement.Bind(servicio.Id, servicio.Nombre, servicio.Descripcion, servicio.DuracionEstimadaMinutos, servicio.PrecioBase));
        return servicio;
    }

    private static Servicio Mapear(Row row)
    {
        return new Servicio
        {
            Id = row.GetValue<Guid>("id"),
            Nombre = row.GetValue<string>("nombre"),
            Descripcion = row.GetValue<string>("descripcion"),
            DuracionEstimadaMinutos = row.GetValue<int>("duracion_estimadaminutos"),
            PrecioBase = row.GetValue<decimal>("precio_base")
        };
    }
}