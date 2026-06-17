namespace Pawpaws.Reportes.DTOs.Externos;

public class PaginaExternaDto<T>
{
    public List<T> Items { get; set; } = new();
    public int Pagina { get; set; }
    public int Tamano { get; set; }
    public int Total { get; set; }
    public int TotalPaginas { get; set; }
}
