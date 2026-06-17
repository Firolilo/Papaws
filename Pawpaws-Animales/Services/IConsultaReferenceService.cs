namespace Pawpaws.Animales.Services;

public interface IConsultaReferenceService
{
    // Borrado en cascada: pide al servicio de Consulta eliminar las consultas de un animal.
    Task EliminarConsultasPorAnimalAsync(Guid animalId);
}
