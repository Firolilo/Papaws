using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Animales.DTOs;

public class CambiarEstadoAnimalDto
{
    [Required]
    public string Estado { get; set; } = string.Empty;

    // Se usan en "Adoptado" (fecha de salida + adoptante) y "Devuelto" (fecha de devolución).
    public DateTime? FechaSalida { get; set; }
    public Guid? AdoptanteRescatistaId { get; set; }

    // En la devolución: en qué condiciones volvió el animal.
    [StringLength(500)]
    public string? Nota { get; set; }
}
