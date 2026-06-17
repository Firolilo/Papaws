using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public interface IConsultaService
{
    Task<List<Pawpaws.Consulta.Models.Consulta>> ObtenerTodosAsync();
    Task<Pawpaws.Consulta.Models.Consulta?> ObtenerPorCodigoAsync(string codigo);
    Task<List<Pawpaws.Consulta.Models.Consulta>> ObtenerPorAnimalAsync(Guid animalId);
    Task<List<Pawpaws.Consulta.Models.Consulta>> ObtenerPorVeterinarioAsync(Guid veterinarioId);
    Task<Pawpaws.Consulta.Models.Consulta> CrearAsync(CrearConsultaDto dto);

    Task<bool> ActualizarAsync(string codigo, ActualizarConsultaDto dto);
    Task<bool> CambiarEstadoAsync(string codigo, string nuevoEstado);
    Task<bool> ReprogramarAsync(string codigo, DateTime nuevaFechaHora);
    Task<bool> ActualizarObservacionesAsync(string codigo, string observaciones);

    Task<bool> RegistrarDiagnosticoAsync(string codigo, string diagnostico, string indicacionesSeguimiento);
    Task<bool> RegistrarProductosAsync(string codigo, List<ProductoUsadoDto> productosUsados);
    Task<List<ProductoUsadoDto>> ObtenerProductosUsadosAsync(string codigo);
}
