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

    public VeterinarioService(Cassandra.ISession session)
    {
        _session = session;
        _insertStatement = _session.Prepare("INSERT INTO veterinarios_by_id (id, nombre_completo, telefono_contacto, especialidad_principal) VALUES (?, ?, ?, ?)");
        _selectAllStatement = _session.Prepare("SELECT id, nombre_completo, telefono_contacto, especialidad_principal FROM veterinarios_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre_completo, telefono_contacto, especialidad_principal FROM veterinarios_by_id WHERE id = ?");
    }

    public async Task<List<Veterinario>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        return rows.Select(Mapear).OrderBy(veterinario => veterinario.NombreCompleto).ToList();
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
            EspecialidadPrincipal = dto.EspecialidadPrincipal
        };

        await _session.ExecuteAsync(_insertStatement.Bind(veterinario.Id, veterinario.NombreCompleto, veterinario.TelefonoContacto, veterinario.EspecialidadPrincipal));
        return veterinario;
    }

    private static Veterinario Mapear(Row row)
    {
        return new Veterinario
        {
            Id = row.GetValue<Guid>("id"),
            NombreCompleto = row.GetValue<string>("nombre_completo"),
            TelefonoContacto = row.GetValue<string>("telefono_contacto"),
            EspecialidadPrincipal = row.GetValue<string>("especialidad_principal")
        };
    }
}