namespace Pawpaws.Reportes.DTOs.Reportes;

// C1: Rescatista_por_id
public class RescatistaPorIdDto
{
    public Guid IdRescatista { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Organizacion { get; set; } = string.Empty;
    public string ZonaOperacion { get; set; } = string.Empty;
}
