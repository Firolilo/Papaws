namespace Pawpaws.Reportes.DTOs.Reportes;

// C15: Consultas_por_codigo (versión simplificada de C6)
public class ConsultaPorCodigoDto
{
    public string CodConsulta { get; set; } = string.Empty;
    public DateTime FechaCita { get; set; }
    public string Estado { get; set; } = string.Empty;
    public Guid IdAnimal { get; set; }
    public string NombreAnimal { get; set; } = string.Empty;
    public Guid IdVeterinario { get; set; }
    public string NombreVeterinario { get; set; } = string.Empty;
}
