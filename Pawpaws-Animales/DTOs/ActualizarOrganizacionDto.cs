using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Animales.DTOs;

public class ActualizarOrganizacionDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [StringLength(80, MinimumLength = 2)]
    public string Tipo { get; set; } = string.Empty;
}
