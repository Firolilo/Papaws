using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class CrearProductoDto
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

    [Range(0, 1000000, ErrorMessage = "El stock debe estar entre 0 y 1.000.000.")]
    public int StockDisponible { get; set; }

    // Opcional: vacío = el producto no vence (material, instrumental, etc.).
    public DateTime? FechaVencimiento { get; set; }

    // Costo unitario para el refugio (alimenta el reporte de gastos).
    [Range(0, 10000000, ErrorMessage = "El costo debe estar entre 0 y 10.000.000.")]
    public decimal CostoUnitario { get; set; }
}