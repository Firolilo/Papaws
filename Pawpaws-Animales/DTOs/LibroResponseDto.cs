namespace Pawpaws.Animales.DTOs;

public sealed record AnimalResponseDto(
    Guid Id,
    string Nombre,
    string Especie,
    decimal PesoActual,
    DateTime FechaIngreso,
    Guid RescatistaId);