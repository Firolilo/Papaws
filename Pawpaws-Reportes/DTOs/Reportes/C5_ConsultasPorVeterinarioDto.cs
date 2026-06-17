namespace Pawpaws.Reportes.DTOs.Reportes;

// C5: Consultas_por_veterinario
public class ConsultasPorVeterinarioDto
{
    public Guid IdVeterinario { get; set; }
    public string NombreVeterinario { get; set; } = string.Empty;
    public List<ConsultaResumenDto> Consultas { get; set; } = new();
}
