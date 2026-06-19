using Pawpaws.Reportes.DTOs.Externos;

namespace Pawpaws.Reportes.Services;

public interface IAnimalesClient
{
    Task<List<AnimalExternoDto>> GetAnimalesAsync();
    Task<AnimalExternoDto?> GetAnimalByIdAsync(Guid id);
    Task<List<AnimalExternoDto>> GetAnimalesByRescatistaAsync(Guid rescatistaId);
    Task<List<RescatistaExternoDto>> GetRescatistasAsync();
    Task<RescatistaExternoDto?> GetRescatistaByIdAsync(Guid id);
    Task<OrganizacionExternoDto?> GetOrganizacionByIdAsync(Guid id);
    Task<List<OrganizacionExternoDto>> GetOrganizacionesAsync();
}
