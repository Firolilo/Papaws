namespace Pawpaws.Animales.Common;

public class PaginaResultado<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Pagina { get; init; }
    public int Tamano { get; init; }
    public int Total { get; init; }
    public int TotalPaginas { get; init; }
}

public static class Paginacion
{
    public const int TamanoPorDefecto = 20;
    public const int TamanoMaximo = 100;

    public static PaginaResultado<T> Paginar<T>(this IReadOnlyList<T> fuente, int pagina, int tamano)
    {
        if (pagina < 1) pagina = 1;
        if (tamano < 1) tamano = TamanoPorDefecto;
        if (tamano > TamanoMaximo) tamano = TamanoMaximo;

        var total = fuente.Count;
        var items = fuente.Skip((pagina - 1) * tamano).Take(tamano).ToList();
        var totalPaginas = total == 0 ? 0 : (int)Math.Ceiling(total / (double)tamano);

        return new PaginaResultado<T>
        {
            Items = items,
            Pagina = pagina,
            Tamano = tamano,
            Total = total,
            TotalPaginas = totalPaginas
        };
    }
}
