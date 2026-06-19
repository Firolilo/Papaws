using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Common;

public static class Mappers
{
    public static AnimalResponseDto ToResponse(this Animal a) =>
        new(a.Id, a.Nombre, a.Especie, a.PesoActual, a.FechaIngreso, a.RescatistaId, a.Estado, a.FechaSalida, a.AdoptanteRescatistaId);

    public static RescatistaResponseDto ToResponse(this Rescatista r) =>
        new(r.Id, r.NombreCompleto, r.TelefonoContacto, r.CorreoElectronico, r.Organizacion, r.OrganizacionId, r.ZonaOperacion, r.Oculto, r.Activo);

    public static List<AnimalResponseDto> ToResponse(this IEnumerable<Animal> animales) =>
        animales.Select(ToResponse).ToList();

    public static List<RescatistaResponseDto> ToResponse(this IEnumerable<Rescatista> rescatistas) =>
        rescatistas.Select(ToResponse).ToList();

    public static OrganizacionResponseDto ToResponse(this Organizacion o) =>
        new(o.Id, o.Nombre, o.Tipo);

    public static List<OrganizacionResponseDto> ToResponse(this IEnumerable<Organizacion> organizaciones) =>
        organizaciones.Select(ToResponse).ToList();

    public static EventoAdopcionResponseDto ToResponse(this EventoAdopcion e) =>
        new(e.Fecha, e.Tipo, e.RescatistaId, e.Nota);

    public static List<EventoAdopcionResponseDto> ToResponse(this IEnumerable<EventoAdopcion> eventos) =>
        eventos.Select(ToResponse).ToList();

    public static EventoOrganizacionResponseDto ToResponse(this EventoOrganizacion e) =>
        new(e.Fecha, e.Tipo, e.OrganizacionAnterior, e.OrganizacionNueva);

    public static List<EventoOrganizacionResponseDto> ToResponse(this IEnumerable<EventoOrganizacion> eventos) =>
        eventos.Select(ToResponse).ToList();

    public static EventoCustodiaResponseDto ToResponse(this EventoCustodia e) =>
        new(e.Fecha, e.Tipo, e.RescatistaAnterior, e.RescatistaNuevo);

    public static List<EventoCustodiaResponseDto> ToResponse(this IEnumerable<EventoCustodia> eventos) =>
        eventos.Select(ToResponse).ToList();
}
