namespace Pawpaws.Consulta.Models;

public class Veterinario
{
    public Guid Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string TelefonoContacto { get; set; } = string.Empty;
    public string EspecialidadPrincipal { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}