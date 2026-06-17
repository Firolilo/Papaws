using Cassandra;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public class VeterinarioService : IVeterinarioService
{
    private readonly Cassandra.ISession _session;
    private readonly PreparedStatement _insertStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByIdStatement;
    private readonly PreparedStatement _updateStatement;
    private readonly PreparedStatement _softDeleteStatement;

    public VeterinarioService(Cassandra.ISession session)
    {
        _session = session;
        _insertStatement = _session.Prepare("INSERT INTO veterinarios_by_id (id, nombre_completo, telefono_contacto, especialidad_principal, activo) VALUES (?, ?, ?, ?, ?)");
        _selectAllStatement = _session.Prepare("SELECT id, nombre_completo, telefono_contacto, especialidad_principal, activo FROM veterinarios_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre_completo, telefono_contacto, especialidad_principal, activo FROM veterinarios_by_id WHERE id = ?");
        _updateStatement = _session.Prepare("UPDATE veterinarios_by_id SET nombre_completo = ?, telefono_contacto = ?, especialidad_principal = ? WHERE id = ?");
        _softDeleteStatement = _session.Prepare("UPDATE veterinarios_by_id SET activo = false WHERE id = ?");
    }

    public async Task<List<Veterinario>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        return rows.Select(Mapear)
            .Where(veterinario => veterinario.Activo)
            .OrderBy(veterinario => veterinario.NombreCompleto)
            .ToList();
    }

    public async Task<Veterinario?> ObtenerPorIdAsync(Guid id)
    {
        var rows = await _session.ExecuteAsync(_selectByIdStatement.Bind(id));
        return rows.FirstOrDefault() is Row row ? Mapear(row) : null;
    }

    public async Task<Veterinario> CrearAsync(CrearVeterinarioDto dto)
    {
        var veterinario = new Veterinario
        {
            Id = Guid.NewGuid(),
            NombreCompleto = dto.NombreCompleto,
            TelefonoContacto = dto.TelefonoContacto,
            EspecialidadPrincipal = dto.EspecialidadPrincipal,
            Activo = true
        };

        await _session.ExecuteAsync(_insertStatement.Bind(veterinario.Id, veterinario.NombreCompleto, veterinario.TelefonoContacto, veterinario.EspecialidadPrincipal, veterinario.Activo));
        return veterinario;
    }

    public async Task<bool> ActualizarAsync(Guid id, ActualizarVeterinarioDto dto)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        await _session.ExecuteAsync(_updateStatement.Bind(dto.NombreCompleto, dto.TelefonoContacto, dto.EspecialidadPrincipal, id));
        return true;
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

    private static Veterinario Mapear(Row row)
    {
        return new Veterinario
        {
            Id = row.GetValue<Guid>("id"),
            NombreCompleto = row.GetValue<string>("nombre_completo"),
            TelefonoContacto = row.GetValue<string>("telefono_contacto"),
            EspecialidadPrincipal = row.GetValue<string>("especialidad_principal"),
            Activo = row.IsNull("activo") || row.GetValue<bool>("activo")
        };
    }
}
