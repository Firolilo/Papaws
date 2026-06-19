using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class RegistrarDiagnosticoDto
{
    [Required]
    [StringLength(500)]
    public string Diagnostico { get; set; } = string.Empty;

    [StringLength(500)]
    public string IndicacionesSeguimiento { get; set; } = string.Empty;

    // Tratamiento e indicación de si el caso lo amerita.
    [StringLength(500)]
    public string? Tratamiento { get; set; }

    public bool? AmeritaTratamiento { get; set; }

    // Fecha sugerida del próximo control / seguimiento.
    public DateTime? ProximoControl { get; set; }

    // Signos clínicos opcionales tomados en la consulta (alimentan la evolución del animal).
    [Range(0.01, 1000)]
    public decimal? Peso { get; set; }

    [Range(20, 50)]
    public decimal? Temperatura { get; set; }

    [StringLength(60)]
    public string? CondicionCorporal { get; set; }
}
