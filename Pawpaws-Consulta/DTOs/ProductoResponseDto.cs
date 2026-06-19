namespace Pawpaws.Consulta.DTOs;

public class ProductoResponseDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = string.Empty;
    public int StockDisponible { get; set; }
    public DateTime? FechaVencimiento { get; set; }
    public decimal CostoUnitario { get; set; }
}