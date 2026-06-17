using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Animales.DTOs;

public class ActualizarRescatistaDto
{
    [Required]
    [StringLength(120)]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required]
    [StringLength(30)]
    public string TelefonoContacto { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string CorreoElectronico { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string Organizacion { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string ZonaOperacion { get; set; } = string.Empty;
}
