namespace Pawpaws.Consulta.DTOs;

public sealed record ServicioResponseDto(
    Guid Id,
    string Nombre,
    string Descripcion,
    int DuracionEstimadaMinutos,
    decimal PrecioBase);
