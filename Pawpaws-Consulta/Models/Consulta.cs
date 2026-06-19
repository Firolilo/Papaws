using Pawpaws.Consulta.DTOs;

namespace Pawpaws.Consulta.Models;

public class Consulta
{
    public string Codigo { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;
    public string? Diagnostico { get; set; }
    public string? IndicacionesSeguimiento { get; set; }
    // Tratamiento aplicado/indicado y si el caso amerita tratamiento.
    public string? Tratamiento { get; set; }
    public bool? AmeritaTratamiento { get; set; }
    // Fecha sugerida para el próximo control (seguimiento).
    public DateTime? ProximoControl { get; set; }
    // Signos clínicos tomados durante la atención (alimentan la evolución del animal).
    public decimal? Peso { get; set; }
    public decimal? Temperatura { get; set; }
    public string? CondicionCorporal { get; set; }
    public Guid AnimalId { get; set; }
    public Guid VeterinarioId { get; set; }
    public List<Guid> ServicioIds { get; set; } = new();
    public List<ProductoUsadoDto> ProductosUsados { get; set; } = new();
}
