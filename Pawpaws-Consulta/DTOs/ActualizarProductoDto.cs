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

    // Opcional: vacío = el producto no vence.
    public DateTime? FechaVencimiento { get; set; }

    [Range(0, 10000000, ErrorMessage = "El costo debe estar entre 0 y 10.000.000.")]
    public decimal CostoUnitario { get; set; }
}
