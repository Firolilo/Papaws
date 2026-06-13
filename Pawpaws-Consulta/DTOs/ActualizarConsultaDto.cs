using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class ActualizarConsultaDto
{
    [Required]
    public DateTime FechaHora { get; set; }

    [Required]
    [StringLength(500)]
    public string Observaciones { get; set; } = string.Empty;

    [MinLength(1, ErrorMessage = "Debe indicar al menos un servicio.")]
    public List<Guid> ServicioIds { get; set; } = new();
}
