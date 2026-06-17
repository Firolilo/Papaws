namespace Pawpaws.Reportes.DTOs.Reportes;

// C19: Rescatista_por_zona
public class RescatistaPorZonaDto
{
    public string ZonaOperacion { get; set; } = string.Empty;
    public Guid IdRescatista { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
