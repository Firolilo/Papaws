namespace Pawpaws.Reportes.DTOs.Reportes;

// C10: Productos_por_stock
public class ProductoPorStockDto
{
    public Guid IdProducto { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public string TipoProducto { get; set; } = string.Empty;
    public int StockDisponible { get; set; }
    public string UnidadMedida { get; set; } = string.Empty;
}
