using Cassandra;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Exceptions;
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
    private readonly PreparedStatement _insertCodigoByAnimalStatement;
    private readonly PreparedStatement _insertCodigoByVeterinarioStatement;
    private readonly PreparedStatement _selectCodigosByAnimalStatement;
    private readonly PreparedStatement _selectCodigosByVeterinarioStatement;
    private readonly PreparedStatement _deleteConsultaProductosStatement;
    private readonly PreparedStatement _deleteConsultaByCodigoStatement;
    private readonly PreparedStatement _deleteCodigoByAnimalStatement;
    private readonly PreparedStatement _deleteCodigoByVeterinarioStatement;
    private readonly PreparedStatement _insertCodigoByServicioStatement;
    private readonly PreparedStatement _selectCodigosByServicioStatement;
    private readonly PreparedStatement _deleteCodigoByServicioStatement;

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
        _insertConsultaStatement = _session.Prepare("INSERT INTO consultas_by_codigo (codigo, fecha_hora, estado, observaciones, diagnostico, indicaciones_seguimiento, animal_id, veterinario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS");
        _selectAllStatement = _session.Prepare("SELECT codigo, fecha_hora, estado, observaciones, diagnostico, indicaciones_seguimiento, tratamiento, amerita_tratamiento, proximo_control, peso, temperatura, condicion_corporal, animal_id, veterinario_id FROM consultas_by_codigo");
        _selectByCodigoStatement = _session.Prepare("SELECT codigo, fecha_hora, estado, observaciones, diagnostico, indicaciones_seguimiento, tratamiento, amerita_tratamiento, proximo_control, peso, temperatura, condicion_corporal, animal_id, veterinario_id FROM consultas_by_codigo WHERE codigo = ?");
        _insertConsultaServicioStatement = _session.Prepare("INSERT INTO consulta_servicios_by_codigo (codigo, servicio_id) VALUES (?, ?)");
        _selectConsultaServiciosStatement = _session.Prepare("SELECT servicio_id FROM consulta_servicios_by_codigo WHERE codigo = ?");
        _deleteConsultaServiciosStatement = _session.Prepare("DELETE FROM consulta_servicios_by_codigo WHERE codigo = ?");
        _updateDiagnosticoStatement = _session.Prepare("UPDATE consultas_by_codigo SET diagnostico = ?, indicaciones_seguimiento = ?, estado = ?, tratamiento = ?, amerita_tratamiento = ?, proximo_control = ?, peso = ?, temperatura = ?, condicion_corporal = ? WHERE codigo = ?");
        _updateEstadoStatement = _session.Prepare("UPDATE consultas_by_codigo SET estado = ? WHERE codigo = ?");
        _updateFechaHoraStatement = _session.Prepare("UPDATE consultas_by_codigo SET fecha_hora = ? WHERE codigo = ?");
        _updateObservacionesStatement = _session.Prepare("UPDATE consultas_by_codigo SET observaciones = ? WHERE codigo = ?");
        _updateCoreStatement = _session.Prepare("UPDATE consultas_by_codigo SET fecha_hora = ?, observaciones = ? WHERE codigo = ?");
        _insertConsultaProductoStatement = _session.Prepare("INSERT INTO consulta_productos_by_codigo (codigo, producto_id, cantidad_usada) VALUES (?, ?, ?)");
        _selectConsultaProductosStatement = _session.Prepare("SELECT producto_id, cantidad_usada FROM consulta_productos_by_codigo WHERE codigo = ?");
        _insertCodigoByAnimalStatement = _session.Prepare("INSERT INTO consulta_codigos_by_animal (animal_id, codigo) VALUES (?, ?)");
        _insertCodigoByVeterinarioStatement = _session.Prepare("INSERT INTO consulta_codigos_by_veterinario (veterinario_id, codigo) VALUES (?, ?)");
        _selectCodigosByAnimalStatement = _session.Prepare("SELECT codigo FROM consulta_codigos_by_animal WHERE animal_id = ?");
        _selectCodigosByVeterinarioStatement = _session.Prepare("SELECT codigo FROM consulta_codigos_by_veterinario WHERE veterinario_id = ?");
        _deleteConsultaProductosStatement = _session.Prepare("DELETE FROM consulta_productos_by_codigo WHERE codigo = ?");
        _deleteConsultaByCodigoStatement = _session.Prepare("DELETE FROM consultas_by_codigo WHERE codigo = ?");
        _deleteCodigoByAnimalStatement = _session.Prepare("DELETE FROM consulta_codigos_by_animal WHERE animal_id = ? AND codigo = ?");
        _deleteCodigoByVeterinarioStatement = _session.Prepare("DELETE FROM consulta_codigos_by_veterinario WHERE veterinario_id = ? AND codigo = ?");
        _insertCodigoByServicioStatement = _session.Prepare("INSERT INTO consulta_codigos_by_servicio (servicio_id, codigo) VALUES (?, ?)");
        _selectCodigosByServicioStatement = _session.Prepare("SELECT codigo FROM consulta_codigos_by_servicio WHERE servicio_id = ?");
        _deleteCodigoByServicioStatement = _session.Prepare("DELETE FROM consulta_codigos_by_servicio WHERE servicio_id = ? AND codigo = ?");
    }

    public async Task<List<Pawpaws.Consulta.Models.Consulta>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        // El listado es liviano: servicios y productos usados se cargan solo en el detalle
        // (ObtenerPorCodigoAsync) para evitar N+1 queries.
        var consultas = rows.Select(MapearConsulta).ToList();

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

    public async Task<List<Pawpaws.Consulta.Models.Consulta>> ObtenerPorAnimalAsync(Guid animalId)
    {
        var codigos = await _session.ExecuteAsync(_selectCodigosByAnimalStatement.Bind(animalId));
        return await ObtenerLivianasPorCodigosAsync(codigos.Select(row => row.GetValue<string>("codigo")));
    }

    public async Task<List<Pawpaws.Consulta.Models.Consulta>> ObtenerPorVeterinarioAsync(Guid veterinarioId)
    {
        var codigos = await _session.ExecuteAsync(_selectCodigosByVeterinarioStatement.Bind(veterinarioId));
        return await ObtenerLivianasPorCodigosAsync(codigos.Select(row => row.GetValue<string>("codigo")));
    }

    public async Task<List<Pawpaws.Consulta.Models.Consulta>> ObtenerPorServicioAsync(Guid servicioId)
    {
        var codigos = await _session.ExecuteAsync(_selectCodigosByServicioStatement.Bind(servicioId));
        return await ObtenerLivianasPorCodigosAsync(codigos.Select(row => row.GetValue<string>("codigo")));
    }

    // Desglose económico de todas las consultas: para cada una calcula el costo en servicios y en
    // productos consumidos. Toda la información vive en este servicio, así que el cálculo es local.
    public async Task<List<GastoConsultaResponseDto>> ObtenerGastosAsync()
    {
        var consultas = await ObtenerTodosAsync();
        var servicios = (await _servicioService.ObtenerTodosAsync()).ToDictionary(s => s.Id);
        var productos = (await _productoService.ObtenerTodosAsync()).ToDictionary(p => p.Id);

        var resultado = new List<GastoConsultaResponseDto>();
        foreach (var consulta in consultas)
        {
            var serviciosIds = await ObtenerServiciosAsync(consulta.Codigo);
            var serviciosLinea = serviciosIds.Select(id => servicios.TryGetValue(id, out var s)
                ? new GastoServicioDto(s.Nombre, s.PrecioBase)
                : new GastoServicioDto("(servicio dado de baja)", 0m)).ToList();

            var productosUsados = await ObtenerProductosUsadosAsync(consulta.Codigo);
            var productosLinea = productosUsados.Select(pu => productos.TryGetValue(pu.ProductoId, out var p)
                ? new GastoProductoDto(p.Nombre, pu.CantidadUsada, p.CostoUnitario, p.CostoUnitario * pu.CantidadUsada)
                : new GastoProductoDto("(producto dado de baja)", pu.CantidadUsada, 0m, 0m)).ToList();

            var costoServicios = serviciosLinea.Sum(s => s.Costo);
            var costoProductos = productosLinea.Sum(p => p.Subtotal);
            resultado.Add(new GastoConsultaResponseDto(
                consulta.Codigo, consulta.FechaHora, consulta.Estado, consulta.AnimalId,
                costoServicios, costoProductos, costoServicios + costoProductos,
                serviciosLinea, productosLinea));
        }

        return resultado.OrderByDescending(r => r.FechaHora).ToList();
    }

    // Listado liviano (sin servicios ni productos) a partir de un conjunto de códigos.
    private async Task<List<Pawpaws.Consulta.Models.Consulta>> ObtenerLivianasPorCodigosAsync(IEnumerable<string> codigos)
    {
        var consultas = new List<Pawpaws.Consulta.Models.Consulta>();
        foreach (var codigo in codigos)
        {
            var rows = await _session.ExecuteAsync(_selectByCodigoStatement.Bind(codigo));
            if (rows.FirstOrDefault() is Row row)
            {
                consultas.Add(MapearConsulta(row));
            }
        }

        return consultas.OrderBy(consulta => consulta.FechaHora).ToList();
    }

    public async Task<Pawpaws.Consulta.Models.Consulta> CrearAsync(CrearConsultaDto dto)
    {
        if (!EstadosValidos.Contains(dto.Estado))
        {
            throw new InvalidOperationException($"Estado inválido. Debe ser uno de: {string.Join(", ", EstadosValidos)}.");
        }

        // Una consulta recién agendada solo puede nacer Pendiente o Confirmada: "Completada"
        // exige diagnóstico/productos (se registran después) y "Cancelada" no tiene sentido al crear.
        if (!dto.Estado.Equals("Pendiente", StringComparison.OrdinalIgnoreCase) &&
            !dto.Estado.Equals("Confirmada", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Una consulta nueva solo puede crearse como Pendiente o Confirmada. Para completarla, registrá el diagnóstico una vez atendida.");
        }

        var estadoAnimal = await _animalReferenceService.ObtenerEstadoAsync(dto.AnimalId);
        if (estadoAnimal is null)
        {
            throw new InvalidOperationException("El animal asociado no existe.");
        }
        // No se agendan consultas para animales adoptados: primero deben ser devueltos al refugio.
        if (estadoAnimal.Equals("Adoptado", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("No se puede agendar una consulta para un animal adoptado. Primero debe registrarse su devolución al refugio.");
        }

        if (await _veterinarioService.ObtenerPorIdAsync(dto.VeterinarioId) is null or { Activo: false })
        {
            throw new InvalidOperationException("El veterinario asociado no existe o está dado de baja.");
        }

        var servicios = await ValidarYObtenerServiciosAsync(dto.ServicioIds);

        var consulta = new Pawpaws.Consulta.Models.Consulta
        {
            Codigo = dto.Codigo,
            FechaHora = dto.FechaHora,
            Estado = dto.Estado,
            Observaciones = dto.Observaciones ?? string.Empty,
            AnimalId = dto.AnimalId,
            VeterinarioId = dto.VeterinarioId,
            ServicioIds = servicios
        };

        var resultado = await _session.ExecuteAsync(_insertConsultaStatement.Bind(consulta.Codigo, consulta.FechaHora, consulta.Estado, consulta.Observaciones, null, null, consulta.AnimalId, consulta.VeterinarioId));
        // INSERT ... IF NOT EXISTS (LWT) devuelve [applied]=false si el código ya existía.
        if (!resultado.First().GetValue<bool>("[applied]"))
        {
            throw new ConflictoException($"Ya existe una consulta con el código '{consulta.Codigo}'.");
        }

        foreach (var servicioId in consulta.ServicioIds)
        {
            await _session.ExecuteAsync(_insertConsultaServicioStatement.Bind(consulta.Codigo, servicioId));
            // Índice inverso: permite listar en qué consultas se usó cada servicio.
            await _session.ExecuteAsync(_insertCodigoByServicioStatement.Bind(servicioId, consulta.Codigo));
        }

        // Índices de búsqueda por animal / veterinario.
        await _session.ExecuteAsync(_insertCodigoByAnimalStatement.Bind(consulta.AnimalId, consulta.Codigo));
        await _session.ExecuteAsync(_insertCodigoByVeterinarioStatement.Bind(consulta.VeterinarioId, consulta.Codigo));

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

        // Reemplazar servicios (y mantener sincronizado el índice inverso por servicio).
        foreach (var servicioId in consulta.ServicioIds)
        {
            await _session.ExecuteAsync(_deleteCodigoByServicioStatement.Bind(servicioId, codigo));
        }
        await _session.ExecuteAsync(_deleteConsultaServiciosStatement.Bind(codigo));
        foreach (var servicioId in servicios)
        {
            await _session.ExecuteAsync(_insertConsultaServicioStatement.Bind(codigo, servicioId));
            await _session.ExecuteAsync(_insertCodigoByServicioStatement.Bind(servicioId, codigo));
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

        // Al cancelar, los productos registrados no llegaron a consumirse: se devuelven al stock.
        if (estadoNuevoNormalizado.Equals("Cancelada", StringComparison.OrdinalIgnoreCase))
        {
            await RestaurarStockAsync(codigo);
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

    public async Task<bool> RegistrarDiagnosticoAsync(string codigo, RegistrarDiagnosticoDto dto)
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

        if (dto.Peso is <= 0)
        {
            throw new InvalidOperationException("El peso debe ser mayor a cero.");
        }

        await _session.ExecuteAsync(_updateDiagnosticoStatement.Bind(
            dto.Diagnostico,
            dto.IndicacionesSeguimiento,
            "Completada",
            dto.Tratamiento,
            dto.AmeritaTratamiento,
            dto.ProximoControl,
            dto.Peso,
            dto.Temperatura,
            dto.CondicionCorporal,
            codigo));
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

        // Agrupamos por producto: si el mismo producto viene repetido sumamos las cantidades
        // (la tabla consulta_productos_by_codigo tiene PK (codigo, producto_id), así que un
        // segundo INSERT sobreescribiría al primero en vez de acumular).
        var cantidadesPorProducto = new Dictionary<Guid, int>();
        foreach (var productoUsado in productosUsados)
        {
            if (productoUsado.CantidadUsada <= 0)
            {
                throw new InvalidOperationException("La cantidad usada debe ser mayor a cero.");
            }

            cantidadesPorProducto[productoUsado.ProductoId] =
                cantidadesPorProducto.GetValueOrDefault(productoUsado.ProductoId) + productoUsado.CantidadUsada;
        }

        // Paso 1: validar TODO antes de tocar nada (evita descontar stock a medias si uno falla).
        foreach (var (productoId, cantidad) in cantidadesPorProducto)
        {
            var producto = await _productoService.ObtenerPorIdAsync(productoId);
            if (producto is null || !producto.Activo)
            {
                throw new InvalidOperationException("Uno o más productos no existen o están dados de baja.");
            }

            if (producto.StockDisponible < cantidad)
            {
                throw new InvalidOperationException($"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.StockDisponible}, solicitado: {cantidad}.");
            }
        }

        // Cantidades ya registradas en esta consulta. Acumulamos sobre ellas en vez de
        // sobreescribir: la PK es (codigo, producto_id), así que un INSERT plano pisaría el
        // valor anterior dejando el registro y el stock descontado fuera de sincronía.
        var yaRegistradas = (await ObtenerProductosUsadosAsync(codigo))
            .ToDictionary(p => p.ProductoId, p => p.CantidadUsada);

        // Paso 2: aplicar. El stock se descuenta solo por la cantidad NUEVA solicitada;
        // el registro guarda el acumulado para reflejar el total realmente usado.
        var batch = new BatchStatement();
        foreach (var (productoId, cantidad) in cantidadesPorProducto)
        {
            await _productoService.AjustarStockAsync(productoId, -cantidad);
            var total = yaRegistradas.GetValueOrDefault(productoId) + cantidad;
            batch.Add(_insertConsultaProductoStatement.Bind(codigo, productoId, total));
        }
        await _session.ExecuteAsync(batch);

        // Marca como completada solo si no estaba ya completada/cancelada
        if (!consulta.Estado.Equals("Completada", StringComparison.OrdinalIgnoreCase))
        {
            await _session.ExecuteAsync(_updateEstadoStatement.Bind("Completada", codigo));
        }
        return true;
    }

    public async Task EliminarPorAnimalAsync(Guid animalId)
    {
        // Escaneo directo de consultas_by_codigo en vez de usar el índice por animal: ese índice
        // pudo no haberse poblado en datos antiguos, lo que dejaría consultas huérfanas. Escanear
        // (volumen acotado) garantiza que NINGUNA consulta del animal sobreviva a su borrado.
        var filas = await _session.ExecuteAsync(_selectAllStatement.Bind());
        var consultas = filas.Select(MapearConsulta).Where(c => c.AnimalId == animalId).ToList();
        foreach (var consulta in consultas)
        {
            await EliminarConsultaCompletaAsync(consulta);
        }
    }

    // Borrado físico completo de una consulta: devuelve el stock y limpia todas las tablas
    // satélite (servicios, productos y punteros por animal / veterinario).
    private async Task EliminarConsultaCompletaAsync(Pawpaws.Consulta.Models.Consulta consulta)
    {
        await RestaurarStockAsync(consulta.Codigo);
        // Limpiar el índice inverso por servicio antes de borrar la relación consulta→servicios.
        var serviciosDeConsulta = await ObtenerServiciosAsync(consulta.Codigo);
        foreach (var servicioId in serviciosDeConsulta)
        {
            await _session.ExecuteAsync(_deleteCodigoByServicioStatement.Bind(servicioId, consulta.Codigo));
        }
        await _session.ExecuteAsync(_deleteConsultaServiciosStatement.Bind(consulta.Codigo));
        await _session.ExecuteAsync(_deleteCodigoByAnimalStatement.Bind(consulta.AnimalId, consulta.Codigo));
        await _session.ExecuteAsync(_deleteCodigoByVeterinarioStatement.Bind(consulta.VeterinarioId, consulta.Codigo));
        await _session.ExecuteAsync(_deleteConsultaByCodigoStatement.Bind(consulta.Codigo));
    }

    // Devuelve al inventario los productos registrados en la consulta y limpia su registro.
    private async Task RestaurarStockAsync(string codigo)
    {
        var productos = await ObtenerProductosUsadosAsync(codigo);
        foreach (var producto in productos)
        {
            await _productoService.AjustarStockAsync(producto.ProductoId, producto.CantidadUsada);
        }
        await _session.ExecuteAsync(_deleteConsultaProductosStatement.Bind(codigo));
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
            if (await _servicioService.ObtenerPorIdAsync(servicioId) is null or { Activo: false })
            {
                throw new InvalidOperationException("Uno o más servicios no existen o están dados de baja.");
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
            Tratamiento = row.IsNull("tratamiento") ? null : row.GetValue<string>("tratamiento"),
            AmeritaTratamiento = row.IsNull("amerita_tratamiento") ? null : row.GetValue<bool>("amerita_tratamiento"),
            ProximoControl = row.IsNull("proximo_control") ? null : row.GetValue<DateTime>("proximo_control"),
            Peso = row.IsNull("peso") ? null : row.GetValue<decimal>("peso"),
            Temperatura = row.IsNull("temperatura") ? null : row.GetValue<decimal>("temperatura"),
            CondicionCorporal = row.IsNull("condicion_corporal") ? null : row.GetValue<string>("condicion_corporal"),
            AnimalId = row.GetValue<Guid>("animal_id"),
            VeterinarioId = row.GetValue<Guid>("veterinario_id")
        };
    }
}
