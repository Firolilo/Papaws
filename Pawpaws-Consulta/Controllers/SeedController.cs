using Cassandra;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Services;

namespace Pawpaws.Consulta.Controllers;

[ApiController]
[Authorize]
[Route("api/seed")]
public class SeedController : ControllerBase
{
    private readonly IVeterinarioService _vetService;
    private readonly IServicioService _servicioService;
    private readonly IProductoService _productoService;
    private readonly Cassandra.ISession _session;

    public SeedController(
        IVeterinarioService vetService,
        IServicioService servicioService,
        IProductoService productoService,
        Cassandra.ISession session)
    {
        _vetService      = vetService;
        _servicioService = servicioService;
        _productoService = productoService;
        _session         = session;
    }

    [HttpPost]
    public async Task<IActionResult> Sembrar([FromBody] SeedConsultaDto dto)
    {
        // Sanea duplicados de siembras anteriores (deja una copia por nombre) y luego crea
        // solo lo que falte. Así el seed es idempotente: ejecutarlo N veces deja el mismo estado.
        await DepurarDuplicadosAsync();

        // ── Veterinarios ──────────────────────────────────────────────────────
        var vetsData = new (string Nombre, string Tel, string Especialidad)[]
        {
            ("Dra. Patricia Vega",  "555-2001", "Medicina General"),
            ("Dr. Roberto Díaz",    "555-2002", "Cirugía"),
            ("Dra. Carmen Ruiz",    "555-2003", "Dermatología"),
            ("Dr. Miguel Soto",     "555-2004", "Odontología"),
            ("Dr. Fernando Leal",   "555-2005", "Exóticos"),
            ("Dra. Isabel Mora",    "555-2006", "Nutrición"),
        };

        var vetsExistentes = (await _vetService.ObtenerTodosAsync())
            .GroupBy(v => v.NombreCompleto, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.OrdinalIgnoreCase);

        var vetIds = new List<Guid>();
        foreach (var (nombre, tel, esp) in vetsData)
        {
            if (vetsExistentes.TryGetValue(nombre, out var existenteId))
            {
                vetIds.Add(existenteId);
                continue;
            }
            var v = await _vetService.CrearAsync(new CrearVeterinarioDto
            {
                NombreCompleto        = nombre,
                TelefonoContacto      = tel,
                EspecialidadPrincipal = esp,
            });
            vetIds.Add(v.Id);
        }

        // ── Servicios ─────────────────────────────────────────────────────────
        // índices: 0-Consulta General · 1-Vacunación · 2-Cirugía Menor
        //          3-Limpieza Dental  · 4-Examen Sangre · 5-Desparasitación
        //          6-Rx Torácico · 7-Ecografía
        // Precios en bolivianos (Bs). Centro sin fines de lucro: cubren costos, no buscan ganancia.
        var serviciosData = new (string Nombre, string Desc, int Min, decimal Precio)[]
        {
            ("Consulta General",   "Revisión y diagnóstico inicial",                30,  30m),
            ("Vacunación",         "Aplicación de vacunas preventivas",             20,  40m),
            ("Cirugía Menor",      "Procedimientos quirúrgicos menores",           90, 250m),
            ("Limpieza Dental",    "Profilaxis dental con ultrasonido",             60, 150m),
            ("Examen de Sangre",   "Hemograma completo y bioquímica",              15,  80m),
            ("Desparasitación",    "Control antiparasitario interno y externo",    25,  25m),
            ("Rx Torácico",        "Radiografía de tórax digital",                 20, 120m),
            ("Ecografía",          "Ultrasonido abdominal diagnóstico",            40, 150m),
        };

        var serviciosExistentes = (await _servicioService.ObtenerTodosAsync())
            .GroupBy(s => s.Nombre, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.OrdinalIgnoreCase);

        var servicioIds = new List<Guid>();
        foreach (var (nombre, desc, min, precio) in serviciosData)
        {
            if (serviciosExistentes.TryGetValue(nombre, out var existenteId))
            {
                // Servicio ya sembrado: actualizar sus datos (precio en Bs incluido).
                await _servicioService.ActualizarAsync(existenteId, new ActualizarServicioDto
                {
                    Nombre                  = nombre,
                    Descripcion             = desc,
                    DuracionEstimadaMinutos = min,
                    PrecioBase              = precio,
                });
                servicioIds.Add(existenteId);
                continue;
            }
            var s = await _servicioService.CrearAsync(new CrearServicioDto
            {
                Nombre                  = nombre,
                Descripcion             = desc,
                DuracionEstimadaMinutos = min,
                PrecioBase              = precio,
            });
            servicioIds.Add(s.Id);
        }

        // ── Productos ─────────────────────────────────────────────────────────
        // Costo unitario en bolivianos (Bs), a precio de insumo (sin margen comercial).
        var productosData = new (string Nombre, string Tipo, string Unidad, int Stock, decimal Costo)[]
        {
            ("Amoxicilina 250mg",    "Medicamento",   "Comprimido",  45,    3m),
            ("Ibuprofeno Vet.",      "Medicamento",   "Comprimido",  30,    2m),
            ("Vitaminas A+D",        "Suplemento",    "Frasco",      12,   35m),
            ("Jeringa 5ml",          "Material",      "Unidad",     150,    2m),
            ("Algodón Estéril",      "Material",      "Rollo",        8,   15m),
            ("Bisturí #22",          "Instrumental",  "Unidad",       3,    6m),
            ("Ivermectina 1%",       "Medicamento",   "ml",          20,    8m),
            ("Sutura 3/0",           "Material",      "Unidad",      35,   20m),
            ("Guantes Estériles M",  "Material",      "Par",         80,    3m),
            ("Suero Fisiológico",    "Líquido",       "Frasco",       5,   12m),
        };

        var productosExistentes = (await _productoService.ObtenerTodosAsync())
            .GroupBy(p => p.Nombre, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        foreach (var (nombre, tipo, unidad, stock, costo) in productosData)
        {
            if (productosExistentes.TryGetValue(nombre, out var existente))
            {
                // Producto ya sembrado: actualizar su costo (Bs) conservando vencimiento y stock.
                await _productoService.ActualizarAsync(existente.Id, new ActualizarProductoDto
                {
                    Nombre           = nombre,
                    Tipo             = tipo,
                    UnidadMedida     = unidad,
                    FechaVencimiento = existente.FechaVencimiento,
                    CostoUnitario    = costo,
                });
                continue;
            }
            await _productoService.CrearAsync(new CrearProductoDto
            {
                Nombre          = nombre,
                Tipo            = tipo,
                UnidadMedida    = unidad,
                StockDisponible = stock,
                CostoUnitario   = costo,
            });
        }

        // ── Consultas ─────────────────────────────────────────────────────────
        if (dto.AnimalIds.Count == 0)
            return Ok(new { sembrado = true, mensaje = "Veterinarios, servicios y productos sembrados. Sin animal IDs para consultas." });

        var insertConsulta = _session.Prepare(
            "INSERT INTO consultas_by_codigo (codigo, fecha_hora, estado, observaciones, diagnostico, indicaciones_seguimiento, animal_id, veterinario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        var insertServicio  = _session.Prepare("INSERT INTO consulta_servicios_by_codigo (codigo, servicio_id) VALUES (?, ?)");
        var insertByAnimal  = _session.Prepare("INSERT INTO consulta_codigos_by_animal (animal_id, codigo) VALUES (?, ?)");
        var insertByVet     = _session.Prepare("INSERT INTO consulta_codigos_by_veterinario (veterinario_id, codigo) VALUES (?, ?)");

        // (Codigo, DaysOffset, Estado, Observaciones, AnimalIdx, VetIdx, ServIdx)
        var consultasData = new (string Codigo, int Days, string Estado, string Obs, int Ai, int Vi, int Si)[]
        {
            ("CONS-2024-001", -90, "Completada", "Control de rutina. Animal en excelente estado general.",          0,  0, 0),
            ("CONS-2024-002", -85, "Completada", "Vacunación antirrábica aplicada correctamente.",                  1,  0, 1),
            ("CONS-2024-003", -80, "Completada", "Extracción dental superior derecha bajo anestesia local.",        2,  1, 3),
            ("CONS-2024-004", -75, "Completada", "Dermatitis alérgica: tratamiento con corticoides 10 días.",       3,  2, 0),
            ("CONS-2024-005", -70, "Completada", "Cirugía de esterilización. Recuperación satisfactoria.",          4,  1, 2),
            ("CONS-2024-006", -60, "Completada", "Examen de sangre sin alteraciones relevantes.",                   5,  0, 4),
            ("CONS-2024-007", -55, "Completada", "Desparasitación interna y externa completa.",                     6,  3, 5),
            ("CONS-2024-008", -50, "Completada", "Fractura en pata delantera tratada quirúrgicamente.",             7,  1, 2),
            ("CONS-2024-009", -45, "Completada", "Limpieza dental con ultrasonido. Sin caries.",                    8,  1, 3),
            ("CONS-2024-010", -40, "Cancelada",  "Cancelada por el propietario sin reagendar.",                     9,  2, 0),
            ("CONS-2024-011", -35, "Completada", "Control de exótico: iguana, revisión de escamas y peso.",        10,  4, 0),
            ("CONS-2024-012", -30, "Completada", "Ecografía abdominal: sin hallazgos patológicos.",                11,  0, 7),
            ("CONS-2024-013", -25, "Completada", "Consulta nutricional, ajuste de dieta y suplemento A+D.",        12,  5, 0),
            ("CONS-2024-014", -20, "Completada", "Vacunación combinada felina: leucemia + rinotraqueitis.",        13,  0, 1),
            ("CONS-2024-015", -14, "Completada", "Rx torácico: descartada neumonía, leve proceso infeccioso.",     14,  0, 6),
            ("CONS-2024-016",  -8, "Confirmada", "Revisión post-operatoria programada a los 30 días.",              0,  1, 0),
            ("CONS-2024-017",  -6, "Confirmada", "Control de exóticos: chinchilla y gecko.",                       15,  4, 0),
            ("CONS-2024-018",  -4, "Confirmada", "Examen de sangre preventivo anual.",                             16,  0, 4),
            ("CONS-2024-019",  -2, "Pendiente",  "Primera consulta de control post-adopción.",                     17,  3, 0),
            ("CONS-2024-020",   0, "Pendiente",  "Vacunación combinada: rabia + moquillo + parvovirus.",           18,  0, 1),
            ("CONS-2024-021",   2, "Pendiente",  "Control de peso y estado nutricional mensual.",                  19,  5, 0),
            ("CONS-2024-022",   4, "Pendiente",  "Cirugía de cataratas programada.",                               20,  1, 2),
            ("CONS-2024-023",   6, "Pendiente",  "Desparasitación trimestral.",                                    21,  3, 5),
            ("CONS-2024-024", -18, "Cancelada",  "No se presentó a la cita. Se reagendará.",                       22,  2, 0),
            ("CONS-2024-025", -65, "Cancelada",  "Cancelada por enfermedad del propietario.",                      23,  0, 1),
        };

        var now = DateTime.UtcNow;
        foreach (var (codigo, days, estado, obs, ai, vi, si) in consultasData)
        {
            var animalId  = dto.AnimalIds[ai % dto.AnimalIds.Count];
            var vetId     = vetIds[vi % vetIds.Count];
            var servId    = servicioIds[si % servicioIds.Count];
            var fecha     = now.AddDays(days);

            await _session.ExecuteAsync(insertConsulta.Bind(
                codigo, fecha, estado, obs, (string?)null, (string?)null, animalId, vetId));
            await _session.ExecuteAsync(insertServicio.Bind(codigo, servId));
            await _session.ExecuteAsync(insertByAnimal.Bind(animalId, codigo));
            await _session.ExecuteAsync(insertByVet.Bind(vetId, codigo));
        }

        return Ok(new
        {
            sembrado = true,
            mensaje  = $"Datos sembrados: {vetIds.Count} vets, {servicioIds.Count} servicios, {productosData.Length} productos, {consultasData.Length} consultas.",
        });
    }

    /// <summary>
    /// Sanea duplicados creados por siembras anteriores: para productos, servicios y
    /// veterinarios deja una sola copia por nombre y da de baja (borrado lógico) las
    /// sobrantes. En productos conserva la de mayor stock para no perder inventario.
    /// </summary>
    private async Task DepurarDuplicadosAsync()
    {
        var productos = await _productoService.ObtenerTodosAsync();
        foreach (var grupo in productos
            .GroupBy(p => p.Nombre, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1))
        {
            foreach (var sobrante in grupo.OrderByDescending(p => p.StockDisponible).Skip(1))
                await _productoService.EliminarAsync(sobrante.Id);
        }

        var servicios = await _servicioService.ObtenerTodosAsync();
        foreach (var grupo in servicios
            .GroupBy(s => s.Nombre, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1))
        {
            foreach (var sobrante in grupo.OrderBy(s => s.Id).Skip(1))
                await _servicioService.EliminarAsync(sobrante.Id);
        }

        var veterinarios = await _vetService.ObtenerTodosAsync();
        foreach (var grupo in veterinarios
            .GroupBy(v => v.NombreCompleto, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1))
        {
            foreach (var sobrante in grupo.OrderBy(v => v.Id).Skip(1))
                await _vetService.EliminarAsync(sobrante.Id);
        }
    }
}
