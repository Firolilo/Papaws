using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class CrearConsultaDto
{
    [Required]
    [StringLength(60)]
    public string Codigo { get; set; } = string.Empty;

    [Required]
    public DateTime FechaHora { get; set; }

    [Required]
    [StringLength(20)]
    public string Estado { get; set; } = "Pendiente";

    [Required]
    [StringLength(500)]
    public string Observaciones { get; set; } = string.Empty;

    [Required]
    public Guid AnimalId { get; set; }

    [Required]
    public Guid VeterinarioId { get; set; }

    [MinLength(1, ErrorMessage = "Debe indicar al menos un servicio.")]
    public List<Guid> ServicioIds { get; set; } = new();
}