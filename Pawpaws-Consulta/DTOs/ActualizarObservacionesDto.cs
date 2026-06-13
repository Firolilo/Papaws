using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class ActualizarObservacionesDto
{
    [Required]
    [StringLength(500)]
    public string Observaciones { get; set; } = string.Empty;
}
