namespace Pawpaws.Reportes.DTOs.Reportes;

// C22: Veterinarios ordenados por cantidad de consultas atendidas (ranking descendente).
public class VeterinarioPorConsultasDto
{
    public Guid IdVeterinario { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string EspecialidadPrincipal { get; set; } = string.Empty;
    public int TotalConsultas { get; set; }
}
