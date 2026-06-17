using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class RegistrarDiagnosticoDto
{
    [Required]
    [StringLength(500)]
    public string Diagnostico { get; set; } = string.Empty;

    [StringLength(500)]
    public string IndicacionesSeguimiento { get; set; } = string.Empty;
}
