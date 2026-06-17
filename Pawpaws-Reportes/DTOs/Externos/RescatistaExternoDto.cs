namespace Pawpaws.Reportes.DTOs.Externos;

public class RescatistaExternoDto
{
    public Guid Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string TelefonoContacto { get; set; } = string.Empty;
    public string CorreoElectronico { get; set; } = string.Empty;
    public string Organizacion { get; set; } = string.Empty;
    public string ZonaOperacion { get; set; } = string.Empty;
}
