namespace Pawpaws.Animales.Models;

/// <summary>
/// Cambio de organización de un rescatista (historia inmutable: alta inicial y cada cambio).
/// </summary>
public class EventoOrganizacion
{
    public Guid RescatistaId { get; set; }
    public DateTime Fecha { get; set; }
    // "Alta" (primera asignación) o "Cambio".
    public string Tipo { get; set; } = string.Empty;
    public Guid? OrganizacionAnteriorId { get; set; }
    public string? OrganizacionAnterior { get; set; }
    public Guid? OrganizacionNuevaId { get; set; }
    public string OrganizacionNueva { get; set; } = string.Empty;
}
