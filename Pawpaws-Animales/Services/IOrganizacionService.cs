using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Services;

public interface IOrganizacionService
{
    Task<List<Organizacion>> ObtenerTodosAsync();
    Task<Organizacion?> ObtenerPorIdAsync(Guid id);
    Task<Organizacion> CrearAsync(CrearOrganizacionDto dto);
    Task<bool> ActualizarAsync(Guid id, ActualizarOrganizacionDto dto);
    Task<bool> EliminarAsync(Guid id);
}
