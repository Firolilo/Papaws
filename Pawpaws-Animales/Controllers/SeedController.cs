using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Services;

namespace Pawpaws.Animales.Controllers;

[ApiController]
[Authorize]
[Route("api/seed")]
public class SeedController : ControllerBase
{
    private readonly IRescatistaService _rescatistaService;
    private readonly IOrganizacionService _organizacionService;
    private readonly IAnimalService _animalService;

    public SeedController(IRescatistaService rescatistaService, IOrganizacionService organizacionService, IAnimalService animalService)
    {
        _rescatistaService = rescatistaService;
        _organizacionService = organizacionService;
        _animalService = animalService;
    }

    [HttpPost]
    public async Task<IActionResult> Sembrar()
    {
        // ── Organizaciones (idempotente por nombre, repartidas por tipo) ────────
        var organizacionesData = new (string Nombre, string Tipo)[]
        {
            ("Refugio Norte",          "Refugio"),
            ("Patitas Sur",            "ONG"),
            ("Refugio Este",           "Refugio"),
            ("Hogar Animal",           "Independiente"),
            ("Centro Canino",          "Autoridad ambiental"),
            ("Patas al Sur",           "Independiente"),
            ("Animal Rescue BA",       "ONG"),
            ("Fundación Vida Animal",  "Autoridad ambiental"),
        };

        // Si la organización ya existe, se corrige su tipo al canónico (re-sembrar repara datos viejos).
        var orgsExistentes = (await _organizacionService.ObtenerTodosAsync())
            .GroupBy(o => o.Nombre, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var orgIdPorNombre = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        foreach (var (nombre, tipo) in organizacionesData)
        {
            if (orgsExistentes.TryGetValue(nombre, out var existente))
            {
                if (!existente.Tipo.Equals(tipo, StringComparison.OrdinalIgnoreCase))
                {
                    await _organizacionService.ActualizarAsync(existente.Id,
                        new ActualizarOrganizacionDto { Nombre = nombre, Tipo = tipo });
                }
                orgIdPorNombre[nombre] = existente.Id;
            }
            else
            {
                var o = await _organizacionService.CrearAsync(new CrearOrganizacionDto { Nombre = nombre, Tipo = tipo });
                orgIdPorNombre[nombre] = o.Id;
            }
        }

        // ── Rescatistas (idempotente por correo, vinculados a su organización) ──
        var rescatistasExistentes = (await _rescatistaService.ObtenerTodosAsync())
            .GroupBy(r => r.CorreoElectronico, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var rescatistasData = new (string Nombre, string Tel, string Correo, string Org, string Zona)[]
        {
            ("María García",     "555-1001", "maria.garcia@papaws.org",     "Refugio Norte",          "Norte"),
            ("Carlos López",     "555-1002", "carlos.lopez@papaws.org",     "Patitas Sur",            "Sur"),
            ("Ana Martínez",     "555-1003", "ana.martinez@papaws.org",     "Refugio Este",           "Este"),
            ("Luis Rodríguez",   "555-1004", "luis.rodriguez@papaws.org",   "Hogar Animal",           "Oeste"),
            ("Sofía Hernández",  "555-1005", "sofia.hernandez@papaws.org",  "Centro Canino",          "Centro"),
            ("Valentina Torres", "555-1006", "valentina.torres@papaws.org", "Patas al Sur",           "Sur"),
            ("Diego Ramírez",    "555-1007", "diego.ramirez@papaws.org",    "Animal Rescue BA",       "Norte"),
            ("Lucía Pérez",      "555-1008", "lucia.perez@papaws.org",      "Fundación Vida Animal",  "Centro"),
        };

        var rIds = new List<Guid>();
        foreach (var (nombre, tel, correo, org, zona) in rescatistasData)
        {
            var orgId = orgIdPorNombre[org];
            if (rescatistasExistentes.TryGetValue(correo, out var existente))
            {
                // Re-vincula a su organización si no la tenía (o la tenía distinta).
                if (existente.OrganizacionId != orgId)
                {
                    await _rescatistaService.ActualizarAsync(existente.Id, new ActualizarRescatistaDto
                    {
                        NombreCompleto = existente.NombreCompleto,
                        TelefonoContacto = existente.TelefonoContacto,
                        CorreoElectronico = existente.CorreoElectronico,
                        OrganizacionId = orgId,
                        ZonaOperacion = existente.ZonaOperacion,
                    });
                }
                rIds.Add(existente.Id);
                continue;
            }
            var r = await _rescatistaService.CrearAsync(new CrearRescatistaDto
            {
                NombreCompleto = nombre,
                TelefonoContacto = tel,
                CorreoElectronico = correo,
                OrganizacionId = orgId,
                ZonaOperacion = zona,
            });
            rIds.Add(r.Id);
        }

        var animalesData = new (string Nombre, string Especie, decimal Peso, int RescIdx)[]
        {
            // Perros
            ("Max",         "Perro",      28.5m, 0), ("Luna",       "Perro",      18.2m, 1),
            ("Rocky",       "Perro",      32.1m, 2), ("Bella",      "Perro",      22.8m, 3),
            ("Thor",        "Perro",      35.0m, 4), ("Coco",       "Perro",      15.3m, 5),
            ("Bruma",       "Perro",      12.4m, 6),
            // Gatos
            ("Mishi",       "Gato",        4.2m, 7), ("Pelusa",     "Gato",        3.8m, 0),
            ("Simba",       "Gato",        5.1m, 1), ("Mochi",      "Gato",        3.2m, 2),
            ("Oreo",        "Gato",        4.7m, 3),
            // Conejos
            ("Algodón",     "Conejo",      1.5m, 4), ("Nieve",      "Conejo",      1.2m, 5),
            ("Caramelo",    "Conejo",      1.8m, 6),
            // Aves y Loros
            ("Pico",        "Ave",         0.3m, 0), ("Canela",     "Ave",         0.4m, 1),
            ("Loro",        "Loro",        0.9m, 2), ("Mango",      "Loro",        1.1m, 3),
            // Exóticos
            ("Tortugi",     "Tortuga",     1.8m, 4), ("Shell",      "Tortuga",     2.1m, 5),
            ("Hammy",       "Hámster",     0.11m, 6), ("Nugget",    "Hámster",     0.13m, 7),
            ("Iggy",        "Iguana",      1.5m, 0), ("Gecko",      "Gecko",       0.08m, 1),
            ("Chisco",      "Chinchilla",  0.6m, 2),
        };

        // Los nombres de animal NO son únicos (puede haber dos "Luna"), así que no se pueden
        // deduplicar por nombre. Para evitar duplicar la carga demo, solo se siembran si todavía
        // no hay animales; si ya existen, se devuelven sus IDs para que el seed de consultas opere.
        var animalesActuales = await _animalService.ObtenerTodosAsync();
        var animalIds = animalesActuales.Select(a => a.Id.ToString()).ToList();

        if (animalesActuales.Count == 0)
        {
            foreach (var (nombre, especie, peso, ri) in animalesData)
            {
                var a = await _animalService.CrearAsync(new CrearAnimalDto
                {
                    Nombre       = nombre,
                    Especie      = especie,
                    PesoActual   = peso,
                    RescatistaId = rIds[ri % rIds.Count],
                });
                animalIds.Add(a.Id.ToString());
            }
        }

        return Ok(new
        {
            sembrado = true,
            mensaje  = $"Rescatistas: {rIds.Count}. Animales: {animalIds.Count}.",
            animalIds,
        });
    }
}
