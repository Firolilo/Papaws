using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class CrearVeterinarioDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required]
    [StringLength(30, MinimumLength = 6)]
    [RegularExpression(@"^[0-9+\-\s()]{6,30}$", ErrorMessage = "El teléfono solo admite dígitos, espacios y los signos + - ( ).")]
    public string TelefonoContacto { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string EspecialidadPrincipal { get; set; } = string.Empty;
}