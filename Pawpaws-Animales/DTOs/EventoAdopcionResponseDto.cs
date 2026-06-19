namespace Pawpaws.Animales.DTOs;

public sealed record EventoAdopcionResponseDto(
    DateTime Fecha,
    string Tipo,
    Guid? RescatistaId,
    string? Nota);
