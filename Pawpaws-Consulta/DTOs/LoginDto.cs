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

    [Range(0, int.MaxValue)]
    public int StockDisponible { get; set; }
}