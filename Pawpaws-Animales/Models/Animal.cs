namespace Pawpaws.Animales.Models;

public class Animal
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Especie { get; set; } = string.Empty;
    public decimal PesoActual { get; set; }
    public DateTime FechaIngreso { get; set; } = DateTime.UtcNow;
    public Guid RescatistaId { get; set; }
    // Estado de estadía/adopción: Disponible, EnTratamiento o Adoptado.
    public string Estado { get; set; } = "Disponible";
    // Solo se completan al marcar Adoptado: cuándo salió y qué rescatista se lo llevó.
    public DateTime? FechaSalida { get; set; }
    public Guid? AdoptanteRescatistaId { get; set; }
}