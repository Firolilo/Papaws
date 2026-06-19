namespace Pawpaws.Animales.Models;

/// <summary>
/// Un movimiento de adopción del animal. La historia es inmutable: una devolución no borra
/// la adopción previa, sino que agrega un nuevo evento.
/// </summary>
public class EventoAdopcion
{
    public Guid AnimalId { get; set; }
    public DateTime Fecha { get; set; }
    // "Adoptado" o "Devuelto".
    public string Tipo { get; set; } = string.Empty;
    // Rescatista que se llevó al animal (adopción) o que lo devolvió.
    public Guid? RescatistaId { get; set; }
    // En la devolución: en qué condiciones volvió el animal.
    public string? Nota { get; set; }
}
