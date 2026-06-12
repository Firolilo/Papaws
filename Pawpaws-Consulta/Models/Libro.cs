namespace Pawpaws.Consulta.Models;

public class Servicio
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public int DuracionEstimadaMinutos { get; set; }
    public decimal PrecioBase { get; set; }
}