using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Services;

public interface IConsultaService
{
    Task<List<Pawpaws.Consulta.Models.Consulta>> ObtenerTodosAsync();
    Task<Pawpaws.Consulta.Models.Consulta?> ObtenerPorCodigoAsync(string codigo);
    Task<Pawpaws.Consulta.Models.Consulta> CrearAsync(CrearConsultaDto dto);
    Task<bool> RegistrarDiagnosticoAsync(string codigo, string diagnostico, string indicacionesSeguimiento);
    Task<bool> RegistrarProductosAsync(string codigo, List<ProductoUsadoDto> productosUsados);
}