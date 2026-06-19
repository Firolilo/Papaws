using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class CrearServicioDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [StringLength(300, MinimumLength = 2)]
    public string Descripcion { get; set; } = string.Empty;

    [Range(1, 1440, ErrorMessage = "La duración debe estar entre 1 y 1440 minutos.")]
    public int DuracionEstimadaMinutos { get; set; }

    [Range(0, 999999, ErrorMessage = "El precio debe estar entre 0 y 999999.")]
    public decimal PrecioBase { get; set; }
}