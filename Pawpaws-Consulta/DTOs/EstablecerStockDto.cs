using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class EstablecerStockDto
{
    [Range(0, 1000000, ErrorMessage = "El stock debe estar entre 0 y 1.000.000.")]
    public int StockDisponible { get; set; }
}
