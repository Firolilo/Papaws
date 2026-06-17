using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public interface IServicioService
{
    Task<List<Servicio>> ObtenerTodosAsync();
    Task<Servicio?> ObtenerPorIdAsync(Guid id);
    Task<Servicio> CrearAsync(CrearServicioDto dto);
    Task<bool> ActualizarAsync(Guid id, ActualizarServicioDto dto);
    Task<bool> EliminarAsync(Guid id);
}