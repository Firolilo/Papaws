using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Animales.DTOs;

public class CrearAnimalDto
{
    [Required]
    [StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [StringLength(80)]
    public string Especie { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 1000)]
    public decimal PesoActual { get; set; }

    [Required]
    public Guid RescatistaId { get; set; }
}