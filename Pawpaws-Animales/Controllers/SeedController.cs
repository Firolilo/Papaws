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
    private readonly IAnimalService _animalService;

    public SeedController(IRescatistaService rescatistaService, IAnimalService animalService)
    {
        _rescatistaService = rescatistaService;
        _animalService = animalService;
    }

    [HttpPost]
    public async Task<IActionResult> Sembrar()
    {
        var existentes = await _rescatistaService.ObtenerTodosAsync();
        if (existentes.Count >= 8)
            return Ok(new { sembrado = false, mensaje = "Ya existen datos.", animalIds = Array.Empty<string>() });

        var rescatistas = new[]
        {
            new CrearRescatistaDto { NombreCompleto = "María García",       TelefonoContacto = "555-1001", CorreoElectronico = "maria.garcia@papaws.org",       Organizacion = "Refugio Norte",        ZonaOperacion = "Norte"  },
            new CrearRescatistaDto { NombreCompleto = "Carlos López",       TelefonoContacto = "555-1002", CorreoElectronico = "carlos.lopez@papaws.org",       Organizacion = "Patitas Sur",           ZonaOperacion = "Sur"    },
            new CrearRescatistaDto { NombreCompleto = "Ana Martínez",       TelefonoContacto = "555-1003", CorreoElectronico = "ana.martinez@papaws.org",       Organizacion = "Refugio Este",          ZonaOperacion = "Este"   },
            new CrearRescatistaDto { NombreCompleto = "Luis Rodríguez",     TelefonoContacto = "555-1004", CorreoElectronico = "luis.rodriguez@papaws.org",     Organizacion = "Hogar Animal",          ZonaOperacion = "Oeste"  },
            new CrearRescatistaDto { NombreCompleto = "Sofía Hernández",    TelefonoContacto = "555-1005", CorreoElectronico = "sofia.hernandez@papaws.org",    Organizacion = "Centro Canino",         ZonaOperacion = "Centro" },
            new CrearRescatistaDto { NombreCompleto = "Valentina Torres",   TelefonoContacto = "555-1006", CorreoElectronico = "valentina.torres@papaws.org",   Organizacion = "Patas al Sur",          ZonaOperacion = "Sur"    },
            new CrearRescatistaDto { NombreCompleto = "Diego Ramírez",      TelefonoContacto = "555-1007", CorreoElectronico = "diego.ramirez@papaws.org",      Organizacion = "Animal Rescue BA",      ZonaOperacion = "Norte"  },
            new CrearRescatistaDto { NombreCompleto = "Lucía Pérez",        TelefonoContacto = "555-1008", CorreoElectronico = "lucia.perez@papaws.org",        Organizacion = "Fundación Vida Animal",  ZonaOperacion = "Centro" },
        };

        var rIds = new List<Guid>();
        foreach (var dto in rescatistas)
        {
            var r = await _rescatistaService.CrearAsync(dto);
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

        var animalIds = new List<string>();
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

        return Ok(new
        {
            sembrado = true,
            mensaje  = $"Sembrados {rIds.Count} rescatistas y {animalIds.Count} animales.",
            animalIds,
        });
    }
}
