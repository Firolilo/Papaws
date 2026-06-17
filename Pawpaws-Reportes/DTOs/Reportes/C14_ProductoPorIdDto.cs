namespace Pawpaws.Reportes.DTOs.Reportes;

// C14: Producto_por_id
public class ProductoPorIdDto
{
    public Guid IdProducto { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public string TipoProducto { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = string.Empty;
    public int StockDisponible { get; set; }
}
