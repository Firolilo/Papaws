using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class CambiarEstadoConsultaDto
{
    [Required]
    [StringLength(20)]
    public string Estado { get; set; } = string.Empty;
}
