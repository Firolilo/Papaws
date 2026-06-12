namespace Pawpaws.Consulta.Models;

public class Producto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = string.Empty;
    public int StockDisponible { get; set; }
}