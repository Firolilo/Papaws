namespace Pawpaws.Reportes.DTOs.Reportes;

// C12: Veterinario_por_id
public class VeterinarioPorIdDto
{
    public Guid IdVeterinario { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string TelefonoContacto { get; set; } = string.Empty;
    public string EspecialidadPrincipal { get; set; } = string.Empty;
}
