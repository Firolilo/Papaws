using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public interface IVeterinarioService
{
    Task<List<Veterinario>> ObtenerTodosAsync();
    Task<Veterinario?> ObtenerPorIdAsync(Guid id);
    Task<Veterinario> CrearAsync(CrearVeterinarioDto dto);
}