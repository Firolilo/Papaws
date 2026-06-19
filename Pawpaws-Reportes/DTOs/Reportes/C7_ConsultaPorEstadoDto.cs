namespace Pawpaws.Reportes.DTOs.Reportes;

// C7: Consultas_por_estado
public class ConsultaPorEstadoDto
{
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaCita { get; set; }
    public string CodReserva { get; set; } = string.Empty;
    public Guid IdAnimal { get; set; }
    public string NombreAnimal { get; set; } = string.Empty;
}
