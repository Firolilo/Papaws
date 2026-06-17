namespace Pawpaws.Reportes.DTOs.Reportes;

// C17: Animales_por_nombre
public class AnimalPorNombreDto
{
    public string NombreAnimal { get; set; } = string.Empty;
    public Guid IdAnimal { get; set; }
    public string Especie { get; set; } = string.Empty;
    public DateTime FechaIngreso { get; set; }
}
