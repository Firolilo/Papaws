namespace Pawpaws.Consulta.Services;

public interface IAnimalReferenceService
{
    Task<bool> ExisteAnimalAsync(Guid animalId);
}