using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Services;

public interface IAnimalService
{
    Task<List<Animal>> ObtenerTodosAsync();
    Task<Animal?> ObtenerPorIdAsync(Guid id);
    Task<List<Animal>> ObtenerPorRescatistaAsync(Guid rescatistaId);
    Task<Animal> CrearAsync(CrearAnimalDto dto);
    Task<bool> ActualizarAsync(Guid id, ActualizarAnimalDto dto);
    Task<bool> EliminarAsync(Guid id);

    // Mueve los animales de un rescatista al destino indicado, respetando el cupo máximo del
    // destino: lo que exceda se deriva al Refugio. Devuelve cuántos fueron a cada lado.
    Task<ReasignacionResultado> ReasignarAnimalesAsync(Guid origenRescatistaId, Guid destinoRescatistaId);

    // Cambia el estado de adopción. "Adoptado" registra salida + adoptante; "Devuelto" registra
    // la devolución conservando la adopción previa en el historial.
    Task<bool> RegistrarEstadoAsync(Guid id, string estado, DateTime? fechaSalida, Guid? adoptanteRescatistaId, string? nota);

    // Historial inmutable de adopciones y devoluciones del animal.
    Task<List<EventoAdopcion>> ObtenerEventosAdopcionAsync(Guid animalId);

    // Historial de custodia del animal (ingreso + reasignaciones entre rescatistas).
    Task<List<EventoCustodia>> ObtenerEventosCustodiaAsync(Guid animalId);
}