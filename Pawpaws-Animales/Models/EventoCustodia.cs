namespace Pawpaws.Animales.Models;

/// <summary>
/// Movimiento de custodia de un animal: su ingreso y cada reasignación a otro rescatista.
/// Permite ver de quién venía y a quién se le asignó, con fecha.
/// </summary>
public class EventoCustodia
{
    public Guid AnimalId { get; set; }
    public DateTime Fecha { get; set; }
    // "Ingreso" (rescatista que lo trajo) o "Reasignacion".
    public string Tipo { get; set; } = string.Empty;
    public Guid? RescatistaAnteriorId { get; set; }
    public string? RescatistaAnterior { get; set; }
    public Guid RescatistaNuevoId { get; set; }
    public string RescatistaNuevo { get; set; } = string.Empty;
}
