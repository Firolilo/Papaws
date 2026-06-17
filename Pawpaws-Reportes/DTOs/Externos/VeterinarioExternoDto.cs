namespace Pawpaws.Reportes.DTOs.Externos;

public class VeterinarioExternoDto
{
    public Guid Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string TelefonoContacto { get; set; } = string.Empty;
    public string EspecialidadPrincipal { get; set; } = string.Empty;
}
