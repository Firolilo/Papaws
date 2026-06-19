using Pawpaws.Reportes.DTOs.Reportes;

namespace Pawpaws.Reportes.Services;

public class ReporteService : IReporteService
{
    private readonly IAnimalesClient _animales;
    private readonly IConsultaClient _consulta;

    public ReporteService(IAnimalesClient animales, IConsultaClient consulta)
    {
        _animales = animales;
        _consulta = consulta;
    }

    public async Task<RescatistaPorIdDto?> C1_RescatistaPorIdAsync(Guid id)
    {
        var r = await _animales.GetRescatistaByIdAsync(id);
        if (r is null) return null;
        return new RescatistaPorIdDto
        {
            IdRescatista = r.Id,
            NombreCompleto = r.NombreCompleto,
            Telefono = r.TelefonoContacto,
            Email = r.CorreoElectronico,
            Organizacion = r.Organizacion,
            ZonaOperacion = r.ZonaOperacion
        };
    }

    public async Task<AnimalesPorRescatistaDto?> C2_AnimalesPorRescatistaAsync(Guid rescatistaId)
    {
        var rescatista = await _animales.GetRescatistaByIdAsync(rescatistaId);
        if (rescatista is null) return null;

        var animales = await _animales.GetAnimalesByRescatistaAsync(rescatistaId);
        return new AnimalesPorRescatistaDto
        {
            IdRescatista = rescatista.Id,
            NombreRescatista = rescatista.NombreCompleto,
            Animales = animales
                .OrderBy(a => a.Id)
                .Select(a => new AnimalResumenDto
                {
                    IdAnimal = a.Id,
                    NombreAnimal = a.Nombre,
                    Especie = a.Especie,
                    FechaIngreso = a.FechaIngreso
                }).ToList()
        };
    }

    public async Task<List<AnimalPorEspecieDto>> C3_AnimalesPorEspecieAsync(string especie)
    {
        var todos = await _animales.GetAnimalesAsync();
        return todos
            .Where(a => a.Especie.Equals(especie, StringComparison.OrdinalIgnoreCase))
            .OrderBy(a => a.Id)
            .Select(a => new AnimalPorEspecieDto
            {
                IdAnimal = a.Id,
                NombreAnimal = a.Nombre,
                Especie = a.Especie,
                FechaIngreso = a.FechaIngreso
            }).ToList();
    }

    public async Task<ConsultasPorAnimalDto?> C4_ConsultasPorAnimalAsync(Guid animalId)
    {
        var animal = await _animales.GetAnimalByIdAsync(animalId);
        if (animal is null) return null;

        var consultas = await _consulta.GetConsultasByAnimalAsync(animalId);
        var vetNombres = await ResolverNombresVetAsync(consultas.Select(c => c.VeterinarioId));
        return new ConsultasPorAnimalDto
        {
            IdAnimal = animal.Id,
            NombreAnimal = animal.Nombre,
            Especie = animal.Especie,
            Consultas = consultas
                .OrderByDescending(c => c.FechaHora)
                .Select(c => new ConsultaResumenDto
                {
                    FechaCita = c.FechaHora,
                    CodConsulta = c.Codigo,
                    IdVeterinario = c.VeterinarioId,
                    NombreVeterinario = vetNombres[c.VeterinarioId],
                    Estado = c.Estado,
                    Observaciones = c.Observaciones
                }).ToList()
        };
    }

    public async Task<ConsultasPorVeterinarioDto?> C5_ConsultasPorVeterinarioAsync(Guid veterinarioId)
    {
        var veterinario = await _consulta.GetVeterinarioByIdAsync(veterinarioId);
        if (veterinario is null) return null;

        var consultas = await _consulta.GetConsultasByVeterinarioAsync(veterinarioId);
        return new ConsultasPorVeterinarioDto
        {
            IdVeterinario = veterinario.Id,
            NombreVeterinario = veterinario.NombreCompleto,
            Consultas = consultas
                .OrderByDescending(c => c.FechaHora)
                .Select(c => new ConsultaResumenDto
                {
                    FechaCita = c.FechaHora,
                    CodConsulta = c.Codigo,
                    IdVeterinario = c.VeterinarioId,
                    NombreVeterinario = veterinario.NombreCompleto,
                    Estado = c.Estado,
                    Observaciones = c.Observaciones
                }).ToList()
        };
    }

    public async Task<DetalleConsultaDto?> C6_DetalleConsultaAsync(string codigo)
    {
        var c = await _consulta.GetConsultaByCodigoAsync(codigo);
        if (c is null) return null;
        var vetNombres = await ResolverNombresVetAsync(new[] { c.VeterinarioId });
        var animalNombres = await ResolverNombresAnimalAsync(new[] { c.AnimalId });
        return new DetalleConsultaDto
        {
            CodConsulta = c.Codigo,
            FechaCita = c.FechaHora,
            Estado = c.Estado,
            IdAnimal = c.AnimalId,
            NombreAnimal = animalNombres[c.AnimalId],
            IdVeterinario = c.VeterinarioId,
            NombreVeterinario = vetNombres[c.VeterinarioId],
            ServicioIds = c.ServicioIds,
            Observaciones = c.Observaciones,
            Diagnostico = c.Diagnostico,
            IndicacionesSeguimiento = c.IndicacionesSeguimiento
        };
    }

    public async Task<List<ConsultaPorEstadoDto>> C7_ConsultasPorEstadoAsync(string estado)
    {
        var todas = await _consulta.GetConsultasAsync();
        var filtradas = todas
            .Where(c => c.Estado.Equals(estado, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(c => c.FechaHora)
            .ToList();
        var animalNombres = await ResolverNombresAnimalAsync(filtradas.Select(c => c.AnimalId));
        return filtradas
            .Select(c => new ConsultaPorEstadoDto
            {
                Estado = c.Estado,
                FechaCita = c.FechaHora,
                CodReserva = c.Codigo,
                IdAnimal = c.AnimalId,
                NombreAnimal = animalNombres[c.AnimalId]
            }).ToList();
    }

    public async Task<List<ServicioPorConsultaDto>> C8_ServiciosPorConsultaAsync(string codigo)
    {
        var consulta = await _consulta.GetConsultaByCodigoAsync(codigo);
        if (consulta is null) return new();

        var resultado = new List<ServicioPorConsultaDto>();
        foreach (var servicioId in consulta.ServicioIds)
        {
            var servicio = await _consulta.GetServicioByIdAsync(servicioId);
            if (servicio is null) continue;
            resultado.Add(new ServicioPorConsultaDto
            {
                CodConsulta = codigo,
                IdServicio = servicio.Id,
                NombreServicio = servicio.Nombre,
                DuracionEstimadaMinutos = servicio.DuracionEstimadaMinutos,
                PrecioBase = servicio.PrecioBase
            });
        }
        return resultado.OrderBy(s => s.NombreServicio).ToList();
    }

    public async Task<List<ProductoPorConsultaDto>> C9_ProductosPorConsultaAsync(string codigo)
    {
        var productosUsados = await _consulta.GetProductosByConsultaAsync(codigo);
        var resultado = new List<ProductoPorConsultaDto>();
        foreach (var pu in productosUsados)
        {
            var producto = await _consulta.GetProductoByIdAsync(pu.ProductoId);
            resultado.Add(new ProductoPorConsultaDto
            {
                CodConsulta = codigo,
                IdProducto = pu.ProductoId,
                NombreProducto = producto?.Nombre ?? pu.ProductoId.ToString(),
                CantidadUsada = pu.CantidadUsada
            });
        }
        return resultado.OrderBy(p => p.IdProducto).ToList();
    }

    public async Task<List<ProductoPorStockDto>> C10_ProductosPorStockAsync()
    {
        var productos = await _consulta.GetProductosAsync();
        return productos
            .OrderBy(p => p.StockDisponible)
            .Select(p => new ProductoPorStockDto
            {
                IdProducto = p.Id,
                NombreProducto = p.Nombre,
                TipoProducto = p.Tipo,
                StockDisponible = p.StockDisponible,
                UnidadMedida = p.UnidadMedida
            }).ToList();
    }

    public async Task<ServicioPorIdDto?> C11_ServicioPorIdAsync(Guid id)
    {
        var s = await _consulta.GetServicioByIdAsync(id);
        if (s is null) return null;
        return new ServicioPorIdDto
        {
            IdServicio = s.Id,
            Nombre = s.Nombre,
            Descripcion = s.Descripcion,
            DuracionEstimadaMinutos = s.DuracionEstimadaMinutos,
            PrecioBase = s.PrecioBase
        };
    }

    public async Task<VeterinarioPorIdDto?> C12_VeterinarioPorIdAsync(Guid id)
    {
        var v = await _consulta.GetVeterinarioByIdAsync(id);
        if (v is null) return null;
        return new VeterinarioPorIdDto
        {
            IdVeterinario = v.Id,
            NombreCompleto = v.NombreCompleto,
            TelefonoContacto = v.TelefonoContacto,
            EspecialidadPrincipal = v.EspecialidadPrincipal
        };
    }

    public async Task<List<VeterinarioPorEspecialidadDto>> C13_VeterinariosPorEspecialidadAsync(string especialidad)
    {
        var todos = await _consulta.GetVeterinariosAsync();
        return todos
            .Where(v => v.EspecialidadPrincipal.Equals(especialidad, StringComparison.OrdinalIgnoreCase))
            .OrderBy(v => v.Id)
            .Select(v => new VeterinarioPorEspecialidadDto
            {
                Especialidad = v.EspecialidadPrincipal,
                IdVeterinario = v.Id,
                NombreCompleto = v.NombreCompleto,
                TelefonoContacto = v.TelefonoContacto
            }).ToList();
    }

    public async Task<ProductoPorIdDto?> C14_ProductoPorIdAsync(Guid id)
    {
        var p = await _consulta.GetProductoByIdAsync(id);
        if (p is null) return null;
        return new ProductoPorIdDto
        {
            IdProducto = p.Id,
            NombreProducto = p.Nombre,
            TipoProducto = p.Tipo,
            UnidadMedida = p.UnidadMedida,
            StockDisponible = p.StockDisponible
        };
    }

    public async Task<ConsultaPorCodigoDto?> C15_ConsultaPorCodigoAsync(string codigo)
    {
        var c = await _consulta.GetConsultaByCodigoAsync(codigo);
        if (c is null) return null;
        var vetNombres = await ResolverNombresVetAsync(new[] { c.VeterinarioId });
        var animalNombres = await ResolverNombresAnimalAsync(new[] { c.AnimalId });
        return new ConsultaPorCodigoDto
        {
            CodConsulta = c.Codigo,
            FechaCita = c.FechaHora,
            Estado = c.Estado,
            IdAnimal = c.AnimalId,
            NombreAnimal = animalNombres[c.AnimalId],
            IdVeterinario = c.VeterinarioId,
            NombreVeterinario = vetNombres[c.VeterinarioId]
        };
    }

    public async Task<List<ConsultaPorFechaDto>> C16_ConsultasPorFechaAsync(DateOnly fecha)
    {
        var todas = await _consulta.GetConsultasAsync();
        var delDia = todas
            .Where(c => DateOnly.FromDateTime(c.FechaHora) == fecha)
            .OrderByDescending(c => c.FechaHora)
            .ToList();
        var animalNombres = await ResolverNombresAnimalAsync(delDia.Select(c => c.AnimalId));
        var vetNombres = await ResolverNombresVetAsync(delDia.Select(c => c.VeterinarioId));
        return delDia
            .Select(c => new ConsultaPorFechaDto
            {
                FechaCita = c.FechaHora,
                CodConsulta = c.Codigo,
                Estado = c.Estado,
                IdAnimal = c.AnimalId,
                NombreAnimal = animalNombres[c.AnimalId],
                IdVeterinario = c.VeterinarioId,
                NombreVeterinario = vetNombres[c.VeterinarioId]
            }).ToList();
    }

    public async Task<List<AnimalPorNombreDto>> C17_AnimalesPorNombreAsync(string nombre)
    {
        var todos = await _animales.GetAnimalesAsync();
        return todos
            .Where(a => a.Nombre.Contains(nombre, StringComparison.OrdinalIgnoreCase))
            .OrderBy(a => a.Nombre)
            .Select(a => new AnimalPorNombreDto
            {
                NombreAnimal = a.Nombre,
                IdAnimal = a.Id,
                Especie = a.Especie,
                FechaIngreso = a.FechaIngreso
            }).ToList();
    }

    public async Task<List<RescatistaPorZonaDto>> C19_RescatistasPorZonaAsync(string zona)
    {
        var todos = await _animales.GetRescatistasAsync();
        return todos
            .Where(r => r.ZonaOperacion.Equals(zona, StringComparison.OrdinalIgnoreCase))
            .OrderBy(r => r.Id)
            .Select(r => new RescatistaPorZonaDto
            {
                ZonaOperacion = r.ZonaOperacion,
                IdRescatista = r.Id,
                NombreCompleto = r.NombreCompleto,
                Telefono = r.TelefonoContacto,
                Email = r.CorreoElectronico
            }).ToList();
    }

    public async Task<OrganizacionDetalleDto?> C20_OrganizacionDetalleAsync(Guid organizacionId)
    {
        var organizacion = await _animales.GetOrganizacionByIdAsync(organizacionId);
        if (organizacion is null) return null;

        var rescatistas = (await _animales.GetRescatistasAsync())
            .Where(r => r.OrganizacionId == organizacionId)
            .OrderBy(r => r.NombreCompleto)
            .ToList();

        var filas = new List<FilaOrganizacionDto>();
        var totalAnimales = 0;
        foreach (var r in rescatistas)
        {
            var animales = (await _animales.GetAnimalesByRescatistaAsync(r.Id))
                .OrderBy(a => a.Nombre)
                .ToList();
            totalAnimales += animales.Count;

            if (animales.Count == 0)
            {
                // El rescatista pertenece a la organización aunque todavía no tenga animales.
                filas.Add(new FilaOrganizacionDto { NombreRescatista = r.NombreCompleto });
                continue;
            }
            foreach (var a in animales)
            {
                filas.Add(new FilaOrganizacionDto
                {
                    NombreRescatista = r.NombreCompleto,
                    NombreAnimal = a.Nombre,
                    Especie = a.Especie,
                    FechaIngreso = a.FechaIngreso
                });
            }
        }

        return new OrganizacionDetalleDto
        {
            IdOrganizacion = organizacion.Id,
            NombreOrganizacion = organizacion.Nombre,
            Tipo = organizacion.Tipo,
            TotalRescatistas = rescatistas.Count,
            TotalAnimales = totalAnimales,
            Filas = filas
        };
    }

    public async Task<List<RescatistaPorTipoOrgDto>> C21_RescatistasPorTipoOrganizacionAsync(string tipo)
    {
        var orgsDelTipo = (await _animales.GetOrganizacionesAsync())
            .Where(o => o.Tipo.Equals(tipo, StringComparison.OrdinalIgnoreCase))
            .ToDictionary(o => o.Id, o => o.Nombre);

        var rescatistas = await _animales.GetRescatistasAsync();
        return rescatistas
            .Where(r => r.OrganizacionId is Guid oid && orgsDelTipo.ContainsKey(oid))
            .Select(r => new RescatistaPorTipoOrgDto
            {
                Tipo = tipo,
                Organizacion = orgsDelTipo[r.OrganizacionId!.Value],
                IdRescatista = r.Id,
                NombreCompleto = r.NombreCompleto,
                ZonaOperacion = r.ZonaOperacion,
                Email = r.CorreoElectronico
            })
            .OrderBy(x => x.Organizacion)
            .ThenBy(x => x.NombreCompleto)
            .ToList();
    }

    // ── Resolución de nombres a prueba de huérfanos ────────────────────────────
    // Los reportes muestran nombres, no IDs crudos. Si una consulta referencia un veterinario
    // dado de baja, se resuelve su nombre (el endpoint por-id devuelve inactivos) y se marca
    // "(dado de baja)"; si la referencia ya no existe, se muestra "(eliminado)" en vez de un
    // campo en blanco o un GUID sin sentido.

    private async Task<Dictionary<Guid, string>> ResolverNombresVetAsync(IEnumerable<Guid> ids)
    {
        var activos = (await _consulta.GetVeterinariosAsync())
            .ToDictionary(v => v.Id, v => v.NombreCompleto);

        var resultado = new Dictionary<Guid, string>();
        foreach (var id in ids.Distinct())
        {
            if (activos.TryGetValue(id, out var nombre))
            {
                resultado[id] = nombre;
                continue;
            }
            // No está entre los activos: puede estar dado de baja (resoluble por-id) o eliminado.
            var vet = await _consulta.GetVeterinarioByIdAsync(id);
            resultado[id] = vet is not null ? $"{vet.NombreCompleto} (dado de baja)" : "(eliminado)";
        }
        return resultado;
    }

    private async Task<Dictionary<Guid, string>> ResolverNombresAnimalAsync(IEnumerable<Guid> ids)
    {
        var existentes = (await _animales.GetAnimalesAsync())
            .ToDictionary(a => a.Id, a => a.Nombre);

        var resultado = new Dictionary<Guid, string>();
        foreach (var id in ids.Distinct())
        {
            // Los animales se borran físicamente: si no está en el listado, ya no existe.
            resultado[id] = existentes.TryGetValue(id, out var nombre) ? nombre : "(eliminado)";
        }
        return resultado;
    }
}
