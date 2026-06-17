namespace Pawpaws.Reportes.DTOs.Reportes;

// C6: Detalles_consulta_por_codigo
public class DetalleConsultaDto
{
    public string CodConsulta { get; set; } = string.Empty;
    public DateTime FechaCita { get; set; }
    public string Estado { get; set; } = string.Empty;
    public Guid IdAnimal { get; set; }
    public Guid IdVeterinario { get; set; }
    public List<Guid> ServicioIds { get; set; } = new();
    public string Observaciones { get; set; } = string.Empty;
    public string? Diagnostico { get; set; }
    public string? IndicacionesSeguimiento { get; set; }
}
