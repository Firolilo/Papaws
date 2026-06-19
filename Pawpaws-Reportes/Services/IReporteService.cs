using Pawpaws.Reportes.DTOs.Reportes;

namespace Pawpaws.Reportes.Services;

public interface IReporteService
{
    // C1: Rescatista_por_id
    Task<RescatistaPorIdDto?> C1_RescatistaPorIdAsync(Guid id);

    // C2: Animales_por_rescatista
    Task<AnimalesPorRescatistaDto?> C2_AnimalesPorRescatistaAsync(Guid rescatistaId);

    // C3: Animales_por_especie
    Task<List<AnimalPorEspecieDto>> C3_AnimalesPorEspecieAsync(string especie);

    // C4: Consultas_por_animal
    Task<ConsultasPorAnimalDto?> C4_ConsultasPorAnimalAsync(Guid animalId);

    // C5: Consultas_por_veterinario
    Task<ConsultasPorVeterinarioDto?> C5_ConsultasPorVeterinarioAsync(Guid veterinarioId);

    // C6: Detalles_consulta_por_codigo
    Task<DetalleConsultaDto?> C6_DetalleConsultaAsync(string codigo);

    // C7: Consultas_por_estado
    Task<List<ConsultaPorEstadoDto>> C7_ConsultasPorEstadoAsync(string estado);

    // C8: Servicios_por_consulta
    Task<List<ServicioPorConsultaDto>> C8_ServiciosPorConsultaAsync(string codigo);

    // C9: Productos_por_consulta
    Task<List<ProductoPorConsultaDto>> C9_ProductosPorConsultaAsync(string codigo);

    // C10: Productos_por_stock
    Task<List<ProductoPorStockDto>> C10_ProductosPorStockAsync();

    // C11: Servicios_por_id
    Task<ServicioPorIdDto?> C11_ServicioPorIdAsync(Guid id);

    // C12: Veterinario_por_id
    Task<VeterinarioPorIdDto?> C12_VeterinarioPorIdAsync(Guid id);

    // C13: Veterinario_por_especialidad
    Task<List<VeterinarioPorEspecialidadDto>> C13_VeterinariosPorEspecialidadAsync(string especialidad);

    // C14: Producto_por_id
    Task<ProductoPorIdDto?> C14_ProductoPorIdAsync(Guid id);

    // C15: Consultas_por_codigo (simplificado)
    Task<ConsultaPorCodigoDto?> C15_ConsultaPorCodigoAsync(string codigo);

    // C16: Consultas_por_fecha
    Task<List<ConsultaPorFechaDto>> C16_ConsultasPorFechaAsync(DateOnly fecha);

    // C17: Animales_por_nombre
    Task<List<AnimalPorNombreDto>> C17_AnimalesPorNombreAsync(string nombre);

    // C19: Rescatista_por_zona
    Task<List<RescatistaPorZonaDto>> C19_RescatistasPorZonaAsync(string zona);

    // C20: Organización → rescatistas → animales
    Task<OrganizacionDetalleDto?> C20_OrganizacionDetalleAsync(Guid organizacionId);
}
