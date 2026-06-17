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
}