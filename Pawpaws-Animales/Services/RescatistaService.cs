using Cassandra;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Services;

public class RescatistaService : IRescatistaService
{
    private readonly Cassandra.ISession _session;
    private readonly PreparedStatement _insertStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByIdStatement;
    private readonly PreparedStatement _updateStatement;
    private readonly PreparedStatement _softDeleteStatement;

    public RescatistaService(Cassandra.ISession session)
    {
        _session = session;
        _insertStatement = _session.Prepare("INSERT INTO rescatistas_by_id (id, nombre_completo, telefono_contacto, correo_electronico, organizacion, zona_operacion, activo) VALUES (?, ?, ?, ?, ?, ?, ?)");
        _selectAllStatement = _session.Prepare("SELECT id, nombre_completo, telefono_contacto, correo_electronico, organizacion, zona_operacion, activo FROM rescatistas_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre_completo, telefono_contacto, correo_electronico, organizacion, zona_operacion, activo FROM rescatistas_by_id WHERE id = ?");
        _updateStatement = _session.Prepare("UPDATE rescatistas_by_id SET nombre_completo = ?, telefono_contacto = ?, correo_electronico = ?, organizacion = ?, zona_operacion = ? WHERE id = ?");
        _softDeleteStatement = _session.Prepare("UPDATE rescatistas_by_id SET activo = false WHERE id = ?");
    }

    public async Task<List<Rescatista>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        return rows.Select(MapearRescatista)
            .Where(rescatista => rescatista.Activo)
            .OrderBy(rescatista => rescatista.NombreCompleto)
            .ToList();
    }

    public async Task<Rescatista?> ObtenerPorIdAsync(Guid id)
    {
        var rows = await _session.ExecuteAsync(_selectByIdStatement.Bind(id));
        return rows.FirstOrDefault() is Row row ? MapearRescatista(row) : null;
    }

    public async Task<Rescatista> CrearAsync(CrearRescatistaDto dto)
    {
        var rescatista = new Rescatista
        {
            Id = Guid.NewGuid(),
            NombreCompleto = dto.NombreCompleto,
            TelefonoContacto = dto.TelefonoContacto,
            CorreoElectronico = dto.CorreoElectronico,
            Organizacion = dto.Organizacion,
            ZonaOperacion = dto.ZonaOperacion,
            Activo = true
        };

        await _session.ExecuteAsync(_insertStatement.Bind(
            rescatista.Id,
            rescatista.NombreCompleto,
            rescatista.TelefonoContacto,
            rescatista.CorreoElectronico,
            rescatista.Organizacion,
            rescatista.ZonaOperacion,
            rescatista.Activo));

        return rescatista;
    }

    public async Task<bool> ActualizarAsync(Guid id, ActualizarRescatistaDto dto)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        await _session.ExecuteAsync(_updateStatement.Bind(
            dto.NombreCompleto,
            dto.TelefonoContacto,
            dto.CorreoElectronico,
            dto.Organizacion,
            dto.ZonaOperacion,
            id));

        return true;
    }

    public async Task<bool> EliminarAsync(Guid id)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        // Borrado lógico: conserva la fila para no romper referencias históricas de animales.
        await _session.ExecuteAsync(_softDeleteStatement.Bind(id));
        return true;
    }

    private static Rescatista MapearRescatista(Row row)
    {
        return new Rescatista
        {
            Id = row.GetValue<Guid>("id"),
            NombreCompleto = row.GetValue<string>("nombre_completo"),
            TelefonoContacto = row.GetValue<string>("telefono_contacto"),
            CorreoElectronico = row.GetValue<string>("correo_electronico"),
            Organizacion = row.GetValue<string>("organizacion"),
            ZonaOperacion = row.GetValue<string>("zona_operacion"),
            // Filas previas a la migración no tienen 'activo' → se consideran activas.
            Activo = row.IsNull("activo") || row.GetValue<bool>("activo")
        };
    }
}
