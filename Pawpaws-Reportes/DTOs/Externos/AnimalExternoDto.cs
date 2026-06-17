namespace Pawpaws.Reportes.DTOs.Externos;

public class AnimalExternoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Especie { get; set; } = string.Empty;
    public decimal PesoActual { get; set; }
    public DateTime FechaIngreso { get; set; }
    public Guid RescatistaId { get; set; }
}
