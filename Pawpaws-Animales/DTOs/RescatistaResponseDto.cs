namespace Pawpaws.Animales.DTOs;

public sealed record RescatistaResponseDto(
    Guid Id,
    string NombreCompleto,
    string TelefonoContacto,
    string CorreoElectronico,
    string Organizacion,
    Guid? OrganizacionId,
    string ZonaOperacion,
    bool Oculto,
    bool Activo);
