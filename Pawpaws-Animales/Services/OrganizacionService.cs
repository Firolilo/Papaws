using Cassandra;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Exceptions;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Services;

public class OrganizacionService : IOrganizacionService
{
    private readonly Cassandra.ISession _session;
    private readonly PreparedStatement _insertStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByIdStatement;
    private readonly PreparedStatement _updateStatement;
    private readonly PreparedStatement _softDeleteStatement;

    public OrganizacionService(Cassandra.ISession session)
    {
        _session = session;
        _insertStatement = _session.Prepare("INSERT INTO organizaciones_by_id (id, nombre, tipo, activo) VALUES (?, ?, ?, ?)");
        _selectAllStatement = _session.Prepare("SELECT id, nombre, tipo, activo FROM organizaciones_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre, tipo, activo FROM organizaciones_by_id WHERE id = ?");
        _updateStatement = _session.Prepare("UPDATE organizaciones_by_id SET nombre = ?, tipo = ? WHERE id = ?");
        _softDeleteStatement = _session.Prepare("UPDATE organizaciones_by_id SET activo = false WHERE id = ?");
    }

    public async Task<List<Organizacion>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        return rows.Select(Mapear)
            .Where(o => o.Activo)
            .OrderBy(o => o.Nombre)
            .ToList();
    }

    public async Task<Organizacion?> ObtenerPorIdAsync(Guid id)
    {
        var rows = await _session.ExecuteAsync(_selectByIdStatement.Bind(id));
        return rows.FirstOrDefault() is Row row ? Mapear(row) : null;
    }

    public async Task<Organizacion> CrearAsync(CrearOrganizacionDto dto)
    {
        await GarantizarNombreUnicoAsync(dto.Nombre, null);

        var organizacion = new Organizacion
        {
            Id = Guid.NewGuid(),
            Nombre = dto.Nombre,
            Tipo = dto.Tipo,
            Activo = true
        };

        await _session.ExecuteAsync(_insertStatement.Bind(organizacion.Id, organizacion.Nombre, organizacion.Tipo, organizacion.Activo));
        return organizacion;
    }

    public async Task<bool> ActualizarAsync(Guid id, ActualizarOrganizacionDto dto)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        await GarantizarNombreUnicoAsync(dto.Nombre, id);
        await _session.ExecuteAsync(_updateStatement.Bind(dto.Nombre, dto.Tipo, id));
        return true;
    }

    public async Task<bool> EliminarAsync(Guid id)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        // Borrado lógico: conserva la fila para no romper el snapshot de organización en rescatistas históricos.
        await _session.ExecuteAsync(_softDeleteStatement.Bind(id));
        return true;
    }

    // Rechaza nombres repetidos entre organizaciones activas (case-insensitive).
    private async Task GarantizarNombreUnicoAsync(string nombre, Guid? excluyendoId)
    {
        var activas = await ObtenerTodosAsync();
        if (activas.Any(o => o.Id != excluyendoId && o.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase)))
        {
            throw new ConflictoException($"Ya existe una organización activa llamada '{nombre}'.");
        }
    }

    private static Organizacion Mapear(Row row) => new()
    {
        Id = row.GetValue<Guid>("id"),
        Nombre = row.GetValue<string>("nombre"),
        Tipo = row.IsNull("tipo") ? string.Empty : row.GetValue<string>("tipo"),
        Activo = row.IsNull("activo") || row.GetValue<bool>("activo")
    };
}
