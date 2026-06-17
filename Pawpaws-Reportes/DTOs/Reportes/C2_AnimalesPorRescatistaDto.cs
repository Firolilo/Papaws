namespace Pawpaws.Reportes.DTOs.Reportes;

// C2: Animales_por_rescatista
public class AnimalesPorRescatistaDto
{
    public Guid IdRescatista { get; set; }
    public string NombreRescatista { get; set; } = string.Empty;
    public List<AnimalResumenDto> Animales { get; set; } = new();
}

public class AnimalResumenDto
{
    public Guid IdAnimal { get; set; }
    public string NombreAnimal { get; set; } = string.Empty;
    public string Especie { get; set; } = string.Empty;
    public DateTime FechaIngreso { get; set; }
}
