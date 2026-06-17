using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Common;

public static class Mappers
{
    public static AnimalResponseDto ToResponse(this Animal a) =>
        new(a.Id, a.Nombre, a.Especie, a.PesoActual, a.FechaIngreso, a.RescatistaId);

    public static RescatistaResponseDto ToResponse(this Rescatista r) =>
        new(r.Id, r.NombreCompleto, r.TelefonoContacto, r.CorreoElectronico, r.Organizacion, r.ZonaOperacion);

    public static List<AnimalResponseDto> ToResponse(this IEnumerable<Animal> animales) =>
        animales.Select(ToResponse).ToList();

    public static List<RescatistaResponseDto> ToResponse(this IEnumerable<Rescatista> rescatistas) =>
        rescatistas.Select(ToResponse).ToList();
}
