using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class CrearVeterinarioDto
{
    [Required]
    [StringLength(120)]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required]
    [StringLength(30)]
    public string TelefonoContacto { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string EspecialidadPrincipal { get; set; } = string.Empty;
}