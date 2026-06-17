namespace Pawpaws.Animales.DTOs;

public sealed record TokenResponseDto(
    string Token,
    DateTime ExpiraUtc,
    string Email,
    string Rol);
