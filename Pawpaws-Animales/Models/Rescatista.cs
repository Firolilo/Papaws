namespace Pawpaws.Animales.Models;

public class Rescatista
{
    // Rescatista interno "Refugio": destino por defecto de los animales cuando se elimina un
    // rescatista y no se indica otro. Siempre existe y está oculto de los listados de gestión.
    public static readonly Guid RefugioId = new("11111111-1111-1111-1111-111111111111");

    public Guid Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string TelefonoContacto { get; set; } = string.Empty;
    public string CorreoElectronico { get; set; } = string.Empty;
    public string Organizacion { get; set; } = string.Empty;
    public string ZonaOperacion { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    // Oculto: no se ofrece como seleccionable ni se gestiona desde la UI (p. ej. el Refugio).
    public bool Oculto { get; set; }
}