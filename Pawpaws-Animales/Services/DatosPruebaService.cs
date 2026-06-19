using Bogus;
using Pawpaws.Animales.DTOs;

namespace Pawpaws.Animales.Services;

public class DatosPruebaService : IDatosPruebaService
{
    private readonly IRescatistaService _rescatistaService;
    private readonly IOrganizacionService _organizacionService;
    private readonly IAnimalService _animalService;

    public DatosPruebaService(IRescatistaService rescatistaService, IOrganizacionService organizacionService, IAnimalService animalService)
    {
        _rescatistaService = rescatistaService;
        _organizacionService = organizacionService;
        _animalService = animalService;
    }

    public async Task<ResultadoCargaDto> GenerarDatosAsync(int cantidad)
    {
        if (cantidad <= 0)
        {
            throw new InvalidOperationException("La cantidad debe ser mayor a cero.");
        }

        if (cantidad > 1000)
        {
            throw new InvalidOperationException("Para la práctica, no se permite generar más de 1000 registros por solicitud.");
        }

        var faker = new Faker("es");
        int rescatistasCreados = 0;
        int animalesCreados = 0;

        // Asegura un puñado de organizaciones para vincular los rescatistas generados.
        var orgIds = new List<Guid>();
        var existentes = (await _organizacionService.ObtenerTodosAsync())
            .ToDictionary(o => o.Nombre, o => o.Id, StringComparer.OrdinalIgnoreCase);
        foreach (var nombre in new[] { "Autoridad ambiental", "ONG Patitas", "Refugio Independiente" })
        {
            if (existentes.TryGetValue(nombre, out var existenteId))
            {
                orgIds.Add(existenteId);
                continue;
            }
            var o = await _organizacionService.CrearAsync(new CrearOrganizacionDto { Nombre = nombre, Tipo = "ONG" });
            orgIds.Add(o.Id);
        }

        for (int i = 0; i < cantidad; i++)
        {
            var rescatista = await _rescatistaService.CrearAsync(new CrearRescatistaDto
            {
                NombreCompleto = faker.Name.FullName(),
                TelefonoContacto = faker.Phone.PhoneNumber(),
                CorreoElectronico = faker.Internet.Email(),
                OrganizacionId = faker.PickRandom(orgIds),
                ZonaOperacion = faker.Address.City()
            });

            rescatistasCreados++;

            var cantidadAnimales = faker.Random.Int(1, 3);
            for (int j = 0; j < cantidadAnimales; j++)
            {
                await _animalService.CrearAsync(new CrearAnimalDto
                {
                    Nombre = faker.Name.FirstName(),
                    Especie = faker.PickRandom("Perro", "Gato", "Conejo", "Ave", "Loro", "Tortuga", "Hámster"),
                    PesoActual = Math.Round((decimal)faker.Random.Double(0.5, 250), 2),
                    RescatistaId = rescatista.Id
                });

                animalesCreados++;
            }
        }

        return new ResultadoCargaDto
        {
            RescatistasCreados = rescatistasCreados,
            AnimalesCreados = animalesCreados,
            Mensaje = "Carga masiva realizada correctamente."
        };
    }
}