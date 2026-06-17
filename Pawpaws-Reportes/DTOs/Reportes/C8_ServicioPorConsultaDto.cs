namespace Pawpaws.Reportes.DTOs.Reportes;

// C8: Servicios_por_consulta
public class ServicioPorConsultaDto
{
    public string CodConsulta { get; set; } = string.Empty;
    public Guid IdServicio { get; set; }
    public string NombreServicio { get; set; } = string.Empty;
    public int DuracionEstimada { get; set; }
    public decimal Costo { get; set; }
}
