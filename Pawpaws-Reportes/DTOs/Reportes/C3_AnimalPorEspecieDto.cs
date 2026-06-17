namespace Pawpaws.Reportes.DTOs.Reportes;

// C3: Animales_por_especie
public class AnimalPorEspecieDto
{
    public Guid IdAnimal { get; set; }
    public string NombreAnimal { get; set; } = string.Empty;
    public string Especie { get; set; } = string.Empty;
    public DateTime FechaIngreso { get; set; }
}
