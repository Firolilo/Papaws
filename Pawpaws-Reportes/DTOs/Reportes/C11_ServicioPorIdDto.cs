namespace Pawpaws.Reportes.DTOs.Reportes;

// C11: Servicios_por_id
public class ServicioPorIdDto
{
    public Guid IdServicio { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public int DuracionEstimadaMinutos { get; set; }
    public decimal PrecioBase { get; set; }
}
