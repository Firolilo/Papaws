using Pawpaws.Consulta.DTOs;
using Pawpaws.Consulta.Models;

namespace Pawpaws.Consulta.Common;

public static class Mappers
{
    public static ConsultaResponseDto ToResponse(this Pawpaws.Consulta.Models.Consulta c) =>
        new()
        {
            Codigo = c.Codigo,
            FechaHora = c.FechaHora,
            Estado = c.Estado,
            Observaciones = c.Observaciones,
            Diagnostico = c.Diagnostico,
            IndicacionesSeguimiento = c.IndicacionesSeguimiento,
            Tratamiento = c.Tratamiento,
            AmeritaTratamiento = c.AmeritaTratamiento,
            ProximoControl = c.ProximoControl,
            Peso = c.Peso,
            Temperatura = c.Temperatura,
            CondicionCorporal = c.CondicionCorporal,
            AnimalId = c.AnimalId,
            VeterinarioId = c.VeterinarioId,
            ServicioIds = c.ServicioIds,
            ProductosUsados = c.ProductosUsados
        };

    public static VeterinarioResponseDto ToResponse(this Veterinario v) =>
        new(v.Id, v.NombreCompleto, v.TelefonoContacto, v.EspecialidadPrincipal);

    public static ServicioResponseDto ToResponse(this Servicio s) =>
        new(s.Id, s.Nombre, s.Descripcion, s.DuracionEstimadaMinutos, s.PrecioBase);

    public static ProductoResponseDto ToResponse(this Producto p) =>
        new()
        {
            Id = p.Id,
            Nombre = p.Nombre,
            Tipo = p.Tipo,
            UnidadMedida = p.UnidadMedida,
            StockDisponible = p.StockDisponible,
            FechaVencimiento = p.FechaVencimiento,
            CostoUnitario = p.CostoUnitario
        };

    public static List<ConsultaResponseDto> ToResponse(this IEnumerable<Pawpaws.Consulta.Models.Consulta> consultas) =>
        consultas.Select(ToResponse).ToList();

    public static List<VeterinarioResponseDto> ToResponse(this IEnumerable<Veterinario> veterinarios) =>
        veterinarios.Select(ToResponse).ToList();

    public static List<ServicioResponseDto> ToResponse(this IEnumerable<Servicio> servicios) =>
        servicios.Select(ToResponse).ToList();

    public static List<ProductoResponseDto> ToResponse(this IEnumerable<Producto> productos) =>
        productos.Select(ToResponse).ToList();
}
