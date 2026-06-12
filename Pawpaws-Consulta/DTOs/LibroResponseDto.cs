namespace Pawpaws.Consulta.DTOs;

public class ConsultaResponseDto
{
    public string Codigo { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;
    public string? Diagnostico { get; set; }
    public string? IndicacionesSeguimiento { get; set; }
    public Guid AnimalId { get; set; }
    public Guid VeterinarioId { get; set; }
    public List<Guid> ServicioIds { get; set; } = new();
}