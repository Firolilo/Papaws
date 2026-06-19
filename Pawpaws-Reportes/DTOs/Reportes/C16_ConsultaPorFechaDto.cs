namespace Pawpaws.Reportes.DTOs.Reportes;

// C16: Consultas_por_fecha
public class ConsultaPorFechaDto
{
    public DateTime FechaCita { get; set; }
    public string CodConsulta { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public Guid IdAnimal { get; set; }
    public string NombreAnimal { get; set; } = string.Empty;
    public Guid IdVeterinario { get; set; }
    public string NombreVeterinario { get; set; } = string.Empty;
}
