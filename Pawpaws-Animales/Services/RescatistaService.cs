using Cassandra;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Services;

public class RescatistaService : IRescatistaService
{
    private readonly Cassandra.ISession _session;
    private readonly IOrganizacionService _organizacionService;
    private readonly PreparedStatement _insertStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByIdStatement;
    private readonly PreparedStatement _updateStatement;
    private readonly PreparedStatement _softDeleteStatement;

    public RescatistaService(Cassandra.ISession session, IOrganizacionService organizacionService)
    {
        _session = session;
        _organizacionService = organizacionService;
        _insertStatement = _session.Prepare("INSERT INTO rescatistas_by_id (id, nombre_completo, telefono_contacto, correo_electronico, organizacion, organizacion_id, zona_operacion, activo, oculto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        _selectAllStatement = _session.Prepare("SELECT id, nombre_completo, telefono_contacto, correo_electronico, organizacion, organizacion_id, zona_operacion, activo, oculto FROM rescatistas_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre_completo, telefono_contacto, correo_electronico, organizacion, organizacion_id, zona_operacion, activo, oculto FROM rescatistas_by_id WHERE id = ?");
        _updateStatement = _session.Prepare("UPDATE rescatistas_by_id SET nombre_completo = ?, telefono_contacto = ?, correo_electronico = ?, organizacion = ?, organizacion_id = ?, zona_operacion = ? WHERE id = ?");
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
        var organizacion = await ResolverOrganizacionAsync(dto.OrganizacionId);

        var rescatista = new Rescatista
        {
            Id = Guid.NewGuid(),
            NombreCompleto = dto.NombreCompleto,
            TelefonoContacto = dto.TelefonoContacto,
            CorreoElectronico = dto.CorreoElectronico,
            Organizacion = organizacion.Nombre,
            OrganizacionId = organizacion.Id,
            ZonaOperacion = dto.ZonaOperacion,
            Activo = true,
            Oculto = false
        };

        await _session.ExecuteAsync(_insertStatement.Bind(
            rescatista.Id,
            rescatista.NombreCompleto,
            rescatista.TelefonoContacto,
            rescatista.CorreoElectronico,
            rescatista.Organizacion,
            rescatista.OrganizacionId,
            rescatista.ZonaOperacion,
            rescatista.Activo,
            rescatista.Oculto));

        return rescatista;
    }

    public async Task<bool> ActualizarAsync(Guid id, ActualizarRescatistaDto dto)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        var organizacion = await ResolverOrganizacionAsync(dto.OrganizacionId);

        await _session.ExecuteAsync(_updateStatement.Bind(
            dto.NombreCompleto,
            dto.TelefonoContacto,
            dto.CorreoElectronico,
            organizacion.Nombre,
            organizacion.Id,
            dto.ZonaOperacion,
            id));

        return true;
    }

    public async Task<bool> EliminarAsync(Guid id)
    {
        if (id == Rescatista.RefugioId)
        {
            throw new InvalidOperationException("El rescatista Refugio es interno y no puede eliminarse.");
        }

        var actual = await ObtenerPorIdAsync(id);
        if (actual is null || !actual.Activo)
        {
            return false;
        }

        // Borrado lógico: conserva la fila para no romper referencias históricas de animales.
        await _session.ExecuteAsync(_softDeleteStatement.Bind(id));
        return true;
    }

    // Valida que la organización exista y esté activa, y devuelve su id + nombre (snapshot).
    private async Task<(Guid? Id, string Nombre)> ResolverOrganizacionAsync(Guid? organizacionId)
    {
        if (organizacionId is null || organizacionId == Guid.Empty)
        {
            throw new InvalidOperationException("Debe seleccionar una organización para el rescatista.");
        }

        var organizacion = await _organizacionService.ObtenerPorIdAsync(organizacionId.Value);
        if (organizacion is null || !organizacion.Activo)
        {
            throw new InvalidOperationException("La organización seleccionada no existe o está dada de baja.");
        }

        return (organizacion.Id, organizacion.Nombre);
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
            OrganizacionId = row.IsNull("organizacion_id") ? null : row.GetValue<Guid>("organizacion_id"),
            ZonaOperacion = row.GetValue<string>("zona_operacion"),
            // Filas previas a la migración no tienen 'activo' → se consideran activas.
            Activo = row.IsNull("activo") || row.GetValue<bool>("activo"),
            // Filas previas a la migración no tienen 'oculto' → se consideran visibles.
            Oculto = !row.IsNull("oculto") && row.GetValue<bool>("oculto")
        };
    }
}
