using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Services;

public interface IRescatistaService
{
    Task<List<Rescatista>> ObtenerTodosAsync();
    Task<Rescatista?> ObtenerPorIdAsync(Guid id);
    Task<Rescatista> CrearAsync(CrearRescatistaDto dto);
    Task<bool> ActualizarAsync(Guid id, ActualizarRescatistaDto dto);
    Task<bool> EliminarAsync(Guid id);
}