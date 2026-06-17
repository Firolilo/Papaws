using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class ActualizarServicioDto
{
    [Required]
    [StringLength(120)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [StringLength(300)]
    public string Descripcion { get; set; } = string.Empty;

    [Range(1, 1440)]
    public int DuracionEstimadaMinutos { get; set; }

    [Range(0.01, 999999)]
    public decimal PrecioBase { get; set; }
}
