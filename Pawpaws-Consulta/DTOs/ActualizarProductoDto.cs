using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class ActualizarProductoDto
{
    [Required]
    [StringLength(120)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [StringLength(80)]
    public string Tipo { get; set; } = string.Empty;

    [Required]
    [StringLength(40)]
    public string UnidadMedida { get; set; } = string.Empty;
}
