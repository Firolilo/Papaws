namespace Pawpaws.Animales.DTOs;

public sealed record EventoOrganizacionResponseDto(
    DateTime Fecha,
    string Tipo,
    string? OrganizacionAnterior,
    string OrganizacionNueva);
