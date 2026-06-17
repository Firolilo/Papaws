using Pawpaws.Reportes.DTOs.Externos;

namespace Pawpaws.Reportes.Services;

public interface IConsultaClient
{
    Task<List<ConsultaExternaDto>> GetConsultasAsync();
    Task<ConsultaExternaDto?> GetConsultaByCodigoAsync(string codigo);
    Task<List<ConsultaExternaDto>> GetConsultasByAnimalAsync(Guid animalId);
    Task<List<ConsultaExternaDto>> GetConsultasByVeterinarioAsync(Guid veterinarioId);
    Task<List<ProductoUsadoExternoDto>> GetProductosByConsultaAsync(string codigo);
    Task<List<VeterinarioExternoDto>> GetVeterinariosAsync();
    Task<VeterinarioExternoDto?> GetVeterinarioByIdAsync(Guid id);
    Task<List<ServicioExternoDto>> GetServiciosAsync();
    Task<ServicioExternoDto?> GetServicioByIdAsync(Guid id);
    Task<List<ProductoExternoDto>> GetProductosAsync();
    Task<ProductoExternoDto?> GetProductoByIdAsync(Guid id);
}
