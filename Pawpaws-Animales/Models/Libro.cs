namespace Pawpaws.Animales.Models;

public class Animal
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Especie { get; set; } = string.Empty;
    public decimal PesoActual { get; set; }
    public DateTime FechaIngreso { get; set; } = DateTime.UtcNow;
    public Guid RescatistaId { get; set; }
}