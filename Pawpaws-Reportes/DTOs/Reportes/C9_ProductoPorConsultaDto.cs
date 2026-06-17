namespace Pawpaws.Reportes.DTOs.Reportes;

// C9: Productos_por_consulta
public class ProductoPorConsultaDto
{
    public string CodConsulta { get; set; } = string.Empty;
    public Guid IdProducto { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public int CantidadUsada { get; set; }
}
