namespace Pawpaws.Reportes.DTOs.Reportes;

// C4: Consultas_por_animal
public class ConsultasPorAnimalDto
{
    public Guid IdAnimal { get; set; }
    public string NombreAnimal { get; set; } = string.Empty;
    public string Especie { get; set; } = string.Empty;
    public List<ConsultaResumenDto> Consultas { get; set; } = new();
}

public class ConsultaResumenDto
{
    public DateTime FechaCita { get; set; }
    public string CodConsulta { get; set; } = string.Empty;
    public Guid IdVeterinario { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;
}
