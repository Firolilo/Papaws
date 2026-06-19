using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Animales.DTOs;

public class ActualizarRescatistaDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required]
    [StringLength(30, MinimumLength = 6)]
    [RegularExpression(@"^[0-9+\-\s()]{6,30}$", ErrorMessage = "El teléfono solo admite dígitos, espacios y los signos + - ( ).")]
    public string TelefonoContacto { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    [EmailAddress(ErrorMessage = "El correo electrónico no tiene un formato válido.")]
    public string CorreoElectronico { get; set; } = string.Empty;

    [Required(ErrorMessage = "Debe seleccionar una organización.")]
    public Guid? OrganizacionId { get; set; }

    [Required]
    [StringLength(120)]
    public string ZonaOperacion { get; set; } = string.Empty;
}
