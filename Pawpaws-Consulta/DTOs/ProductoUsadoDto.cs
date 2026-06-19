using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class ProductoUsadoDto
{
    [Required]
    public Guid ProductoId { get; set; }

    [Range(1, 100000, ErrorMessage = "La cantidad usada debe estar entre 1 y 100000.")]
    public int CantidadUsada { get; set; }
}