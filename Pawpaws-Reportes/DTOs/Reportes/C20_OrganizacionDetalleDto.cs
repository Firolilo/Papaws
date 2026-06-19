namespace Pawpaws.Reportes.DTOs.Reportes;

// C20: Organización → rescatistas → animales (vista plana para listado/PDF).
public class OrganizacionDetalleDto
{
    public Guid IdOrganizacion { get; set; }
    public string NombreOrganizacion { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public int TotalRescatistas { get; set; }
    public int TotalAnimales { get; set; }
    public List<FilaOrganizacionDto> Filas { get; set; } = new();
}

public class FilaOrganizacionDto
{
    public string NombreRescatista { get; set; } = string.Empty;
    public string NombreAnimal { get; set; } = string.Empty;
    public string Especie { get; set; } = string.Empty;
    public DateTime? FechaIngreso { get; set; }
}
