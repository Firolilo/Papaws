using Cassandra;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public class ConsultaService : IConsultaService
{
    private static readonly HashSet<string> EstadosValidos = new(StringComparer.OrdinalIgnoreCase)
    {
        "Pendiente", "Confirmada", "Cancelada", "Completada"
    };

    private readonly Cassandra.ISession _session;
    private readonly IAnimalReferenceService _animalReferenceService;
    private readonly IVeterinarioService _veterinarioService;
    private readonly IServicioService _servicioService;
    private readonly IProductoService _productoService;
    private readonly PreparedStatement _insertConsultaStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByCodigoStatement;
    private readonly PreparedStatement _insertConsultaServicioStatement;
    private readonly PreparedStatement _selectConsultaServiciosStatement;
    private readonly PreparedStatement _deleteConsultaServiciosStatement;
    private readonly PreparedStatement _updateDiagnosticoStatement;
    private readonly PreparedStatement _updateEstadoStatement;
    private readonly PreparedStatement _updateFechaHoraStatement;
    private readonly PreparedStatement _updateObservacionesStatement;
    private readonly PreparedStatement _updateCoreStatement;
    private readonly PreparedStatement _insertConsultaProductoStatement;
    private readonly PreparedStatement _selectConsultaProductosStatement;

    public ConsultaService(
        Cassandra.ISession session,
        IAnimalReferenceService animalReferenceService,
        IVeterinarioService veterinarioService,
        IServicioService servicioService,
        IProductoService productoService)
    {
        _session = session;
        _animalReferenceService = animalReferenceService;
        _veterinarioService = veterinarioService;
        _servicioService = servicioService;
        _productoService = productoService;
        _insertConsultaStatement = _session.Prepare("INSERT INTO consultas_by_codigo (codigo, fecha_hora, estado, observaciones, diagnostico, indicaciones_seguimiento, animal_id, veterinario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        _selectAllStatement = _session.Prepare("SELECT codigo, fecha_hora, estado, observaciones, diagnostico, indicaciones_seguimiento, animal_id, veterinario_id FROM consultas_by_codigo");
        _selectByCodigoStatement = _session.Prepare("SELECT codigo, fecha_hora, estado, observaciones, diagnostico, indicaciones_seguimiento, animal_id, veterinario_id FROM consultas_by_codigo WHERE codigo = ?");
        _insertConsultaServicioStatement = _session.Prepare("INSERT INTO consulta_servicios_by_codigo (codigo, servicio_id) VALUES (?, ?)");
        _selectConsultaServiciosStatement = _session.Prepare("SELECT servicio_id FROM consulta_servicios_by_codigo WHERE codigo = ?");
        _deleteConsultaServiciosStatement = _session.Prepare("DELETE FROM consulta_servicios_by_codigo WHERE codigo = ?");
        _updateDiagnosticoStatement = _session.Prepare("UPDATE consultas_by_codigo SET diagnostico = ?, indicaciones_seguimiento = ?, estado = ? WHERE codigo = ?");
        _updateEstadoStatement = _session.Prepare("UPDATE consultas_by_codigo SET estado = ? WHERE codigo = ?");
        _updateFechaHoraStatement = _session.Prepare("UPDATE consultas_by_codigo SET fecha_hora = ? WHERE codigo = ?");
        _updateObservacionesStatement = _session.Prepare("UPDATE consultas_by_codigo SET observaciones = ? WHERE codigo = ?");
        _updateCoreStatement = _session.Prepare("UPDATE consultas_by_codigo SET fecha_hora = ?, observaciones = ? WHERE codigo = ?");
        _insertConsultaProductoStatement = _session.Prepare("INSERT INTO consulta_productos_by_codigo (codigo, producto_id, cantidad_usada) VALUES (?, ?, ?)");
        _selectConsultaProductosStatement = _session.Prepare("SELECT producto_id, cantidad_usada FROM consulta_productos_by_codigo WHERE codigo = ?");
    }

    public async Task<List<Pawpaws.Consulta.Models.Consulta>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        var consultas = rows.Select(MapearConsulta).ToList();

        foreach (var consulta in consultas)
        {
            consulta.ServicioIds = await ObtenerServiciosAsync(consulta.Codigo);
        }

        return consultas.OrderBy(consulta => consulta.FechaHora).ToList();
    }

    public async Task<Pawpaws.Consulta.Models.Consulta?> ObtenerPorCodigoAsync(string codigo)
    {
        var rows = await _session.ExecuteAsync(_selectByCodigoStatement.Bind(codigo));
        var consulta = rows.FirstOrDefault() is Row row ? MapearConsulta(row) : null;
        if (consulta is null)
        {
            return null;
        }

        consulta.ServicioIds = await ObtenerServiciosAsync(codigo);
        consulta.ProductosUsados = await ObtenerProductosUsadosAsync(codigo);
        return consulta;
    }

    public async Task<Pawpaws.Consulta.Models.Consulta> CrearAsync(CrearConsultaDto dto)
    {
        if (!EstadosValidos.Contains(dto.Estado))
        {
            throw new InvalidOperationException($"Estado inválido. Debe ser uno de: {string.Join(", ", EstadosValidos)}.");
        }

        if (!await _animalReferenceService.ExisteAnimalAsync(dto.AnimalId))
        {
            throw new InvalidOperationException("El animal asociado no existe.");
        }

        if (await _veterinarioService.ObtenerPorIdAsync(dto.VeterinarioId) is null)
        {
            throw new InvalidOperationException("El veterinario asociado no existe.");
        }

        var servicios = await ValidarYObtenerServiciosAsync(dto.ServicioIds);

        var consulta = new Pawpaws.Consulta.Models.Consulta
        {
            Codigo = dto.Codigo,
            FechaHora = dto.FechaHora,
            Estado = dto.Estado,
            Observaciones = dto.Observaciones,
            AnimalId = dto.AnimalId,
            VeterinarioId = dto.VeterinarioId,
            ServicioIds = servicios
        };

        await _session.ExecuteAsync(_insertConsultaStatement.Bind(consulta.Codigo, consulta.FechaHora, consulta.Estado, consulta.Observaciones, null, null, consulta.AnimalId, consulta.VeterinarioId));

        foreach (var servicioId in consulta.ServicioIds)
        {
            await _session.ExecuteAsync(_insertConsultaServicioStatement.Bind(consulta.Codigo, servicioId));
        }

        return consulta;
    }

    public async Task<bool> ActualizarAsync(string codigo, ActualizarConsultaDto dto)
    {
        var consulta = await ObtenerPorCodigoAsync(codigo);
        if (consulta is null)
        {
            return false;
        }

        if (consulta.Estado.Equals("Completada", StringComparison.OrdinalIgnoreCase) ||
            consulta.Estado.Equals("Cancelada", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"No se puede modificar una consulta en estado '{consulta.Estado}'.");
        }

        var servicios = await ValidarYObtenerServiciosAsync(dto.ServicioIds);

        await _session.ExecuteAsync(_updateCoreStatement.Bind(dto.FechaHora, dto.Observaciones, codigo));

        // Reemplazar servicios
        await _session.ExecuteAsync(_deleteConsultaServiciosStatement.Bind(codigo));
        foreach (var servicioId in servicios)
        {
            await _session.ExecuteAsync(_insertConsultaServicioStatement.Bind(codigo, servicioId));
        }

        return true;
    }

    public async Task<bool> CambiarEstadoAsync(string codigo, string nuevoEstado)
    {
        if (!EstadosValidos.Contains(nuevoEstado))
        {
            throw new InvalidOperationException($"Estado inválido. Debe ser uno de: {string.Join(", ", EstadosValidos)}.");
        }

        var consulta = await ObtenerPorCodigoAsync(codigo);
        if (consulta is null)
        {
            return false;
        }

        var estadoActual = consulta.Estado;
        var estadoNuevoNormalizado = NormalizarEstado(nuevoEstado);

        if (estadoActual.Equals(estadoNuevoNormalizado, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (estadoActual.Equals("Cancelada", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Una consulta cancelada no puede cambiar de estado.");
        }

        if (estadoActual.Equals("Completada", StringComparison.OrdinalIgnoreCase) &&
            !estadoNuevoNormalizado.Equals("Cancelada", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Una consulta completada solo puede cancelarse.");
        }

        await _session.ExecuteAsync(_updateEstadoStatement.Bind(estadoNuevoNormalizado, codigo));
        return true;
    }

    public async Task<bool> ReprogramarAsync(string codigo, DateTime nuevaFechaHora)
    {
        var consulta = await ObtenerPorCodigoAsync(codigo);
        if (consulta is null)
        {
            return false;
        }

        if (consulta.Estado.Equals("Completada", StringComparison.OrdinalIgnoreCase) ||
            consulta.Estado.Equals("Cancelada", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"No se puede reprogramar una consulta en estado '{consulta.Estado}'.");
        }

        await _session.ExecuteAsync(_updateFechaHoraStatement.Bind(nuevaFechaHora, codigo));
        return true;
    }

    public async Task<bool> ActualizarObservacionesAsync(string codigo, string observaciones)
    {
        var consulta = await ObtenerPorCodigoAsync(codigo);
        if (consulta is null)
        {
            return false;
        }

        await _session.ExecuteAsync(_updateObservacionesStatement.Bind(observaciones, codigo));
        return true;
    }

    public async Task<bool> RegistrarDiagnosticoAsync(string codigo, string diagnostico, string indicacionesSeguimiento)
    {
        var consulta = await ObtenerPorCodigoAsync(codigo);
        if (consulta is null)
        {
            return false;
        }

        if (consulta.Estado.Equals("Cancelada", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("No se puede registrar diagnóstico en una consulta cancelada.");
        }

        await _session.ExecuteAsync(_updateDiagnosticoStatement.Bind(diagnostico, indicacionesSeguimiento, "Completada", codigo));
        return true;
    }

    public async Task<bool> RegistrarProductosAsync(string codigo, List<ProductoUsadoDto> productosUsados)
    {
        var consulta = await ObtenerPorCodigoAsync(codigo);
        if (consulta is null)
        {
            return false;
        }

        if (consulta.Estado.Equals("Cancelada", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("No se pueden registrar productos en una consulta cancelada.");
        }

        foreach (var productoUsado in productosUsados)
        {
            if (productoUsado.CantidadUsada <= 0)
            {
                throw new InvalidOperationException("La cantidad usada debe ser mayor a cero.");
            }

            var producto = await _productoService.ObtenerPorIdAsync(productoUsado.ProductoId);
            if (producto is null)
            {
                throw new InvalidOperationException("Uno o más productos no existen.");
            }

            if (producto.StockDisponible < productoUsado.CantidadUsada)
            {
                throw new InvalidOperationException($"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.StockDisponible}.");
            }

            await _productoService.AjustarStockAsync(productoUsado.ProductoId, -productoUsado.CantidadUsada);
            await _session.ExecuteAsync(_insertConsultaProductoStatement.Bind(codigo, productoUsado.ProductoId, productoUsado.CantidadUsada));
        }

        // Marca como completada solo si no estaba ya completada/cancelada
        if (!consulta.Estado.Equals("Completada", StringComparison.OrdinalIgnoreCase))
        {
            await _session.ExecuteAsync(_updateEstadoStatement.Bind("Completada", codigo));
        }
        return true;
    }

    public async Task<List<ProductoUsadoDto>> ObtenerProductosUsadosAsync(string codigo)
    {
        var rows = await _session.ExecuteAsync(_selectConsultaProductosStatement.Bind(codigo));
        return rows.Select(row => new ProductoUsadoDto
        {
            ProductoId = row.GetValue<Guid>("producto_id"),
            CantidadUsada = row.GetValue<int>("cantidad_usada")
        }).ToList();
    }

    private async Task<List<Guid>> ObtenerServiciosAsync(string codigo)
    {
        var rows = await _session.ExecuteAsync(_selectConsultaServiciosStatement.Bind(codigo));
        return rows.Select(row => row.GetValue<Guid>("servicio_id")).ToList();
    }

    private async Task<List<Guid>> ValidarYObtenerServiciosAsync(List<Guid> servicioIds)
    {
        var servicios = new List<Guid>();
        foreach (var servicioId in servicioIds.Distinct())
        {
            if (await _servicioService.ObtenerPorIdAsync(servicioId) is null)
            {
                throw new InvalidOperationException("Uno o más servicios no existen.");
            }

            servicios.Add(servicioId);
        }

        if (servicios.Count == 0)
        {
            throw new InvalidOperationException("Debe indicar al menos un servicio.");
        }

        return servicios;
    }

    private static string NormalizarEstado(string estado)
    {
        return EstadosValidos.First(e => e.Equals(estado, StringComparison.OrdinalIgnoreCase));
    }

    private static Pawpaws.Consulta.Models.Consulta MapearConsulta(Row row)
    {
        return new Pawpaws.Consulta.Models.Consulta
        {
            Codigo = row.GetValue<string>("codigo"),
            FechaHora = row.GetValue<DateTime>("fecha_hora"),
            Estado = row.GetValue<string>("estado"),
            Observaciones = row.GetValue<string>("observaciones"),
            Diagnostico = row.IsNull("diagnostico") ? null : row.GetValue<string>("diagnostico"),
            IndicacionesSeguimiento = row.IsNull("indicaciones_seguimiento") ? null : row.GetValue<string>("indicaciones_seguimiento"),
            AnimalId = row.GetValue<Guid>("animal_id"),
            VeterinarioId = row.GetValue<Guid>("veterinario_id")
        };
    }
}
