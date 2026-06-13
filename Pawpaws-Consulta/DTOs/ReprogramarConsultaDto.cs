using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class ReprogramarConsultaDto
{
    [Required]
    public DateTime FechaHora { get; set; }
}
