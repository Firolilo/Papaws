namespace Pawpaws.Consulta.Services;

public interface IAnimalReferenceService
{
    Task<bool> ExisteAnimalAsync(Guid animalId);

    // Estado actual del animal (Disponible, EnTratamiento, Adoptado, Devuelto) o null si no existe.
    Task<string?> ObtenerEstadoAsync(Guid animalId);
}