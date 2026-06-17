namespace Pawpaws.Reportes.DTOs.Reportes;

// C15: Consultas_por_codigo (versión simplificada de C6)
public class ConsultaPorCodigoDto
{
    public string CodConsulta { get; set; } = string.Empty;
    public DateTime FechaCita { get; set; }
    public string Estado { get; set; } = string.Empty;
    public Guid IdAnimal { get; set; }
    public Guid IdVeterinario { get; set; }
}
