namespace Pawpaws.Reportes.DTOs.Reportes;

// C13: Veterinario_por_especialidad
public class VeterinarioPorEspecialidadDto
{
    public string Especialidad { get; set; } = string.Empty;
    public Guid IdVeterinario { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string TelefonoContacto { get; set; } = string.Empty;
}
