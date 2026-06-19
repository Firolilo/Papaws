namespace Pawpaws.Animales.DTOs;

public sealed record EventoCustodiaResponseDto(
    DateTime Fecha,
    string Tipo,
    string? RescatistaAnterior,
    string RescatistaNuevo);
