namespace Pawpaws.Animales.Models;

/// <summary>
/// Organización a la que pertenece un rescatista (ej. ONG, autoridad ambiental, refugio).
/// Catálogo propio para vincular rescatistas y reportar por organización.
/// </summary>
public class Organizacion
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    // Tipo libre: ONG, Autoridad ambiental, Refugio, Independiente, etc.
    public string Tipo { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}
