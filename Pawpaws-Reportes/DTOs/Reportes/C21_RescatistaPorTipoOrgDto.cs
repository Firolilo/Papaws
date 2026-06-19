namespace Pawpaws.Reportes.DTOs.Reportes;

// C21: Rescatistas (voluntarios) por tipo de organización.
public class RescatistaPorTipoOrgDto
{
    public string Tipo { get; set; } = string.Empty;
    public string Organizacion { get; set; } = string.Empty;
    public Guid IdRescatista { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string ZonaOperacion { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
