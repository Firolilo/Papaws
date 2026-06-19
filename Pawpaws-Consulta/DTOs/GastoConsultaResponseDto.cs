namespace Pawpaws.Consulta.DTOs;

public sealed record GastoServicioDto(string Nombre, decimal Costo);

public sealed record GastoProductoDto(string Nombre, int Cantidad, decimal CostoUnitario, decimal Subtotal);

// Desglose económico de una consulta: cuánto costó en servicios y en productos consumidos.
public sealed record GastoConsultaResponseDto(
    string Codigo,
    DateTime FechaHora,
    string Estado,
    Guid AnimalId,
    decimal CostoServicios,
    decimal CostoProductos,
    decimal Total,
    List<GastoServicioDto> Servicios,
    List<GastoProductoDto> Productos);
