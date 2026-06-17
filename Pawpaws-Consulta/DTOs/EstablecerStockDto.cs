using System.ComponentModel.DataAnnotations;

namespace Pawpaws.Consulta.DTOs;

public class EstablecerStockDto
{
    [Range(0, int.MaxValue)]
    public int StockDisponible { get; set; }
}
