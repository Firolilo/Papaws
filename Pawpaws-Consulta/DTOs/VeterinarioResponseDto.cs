namespace Pawpaws.Consulta.DTOs;

public sealed record VeterinarioResponseDto(
    Guid Id,
    string NombreCompleto,
    string TelefonoContacto,
    string EspecialidadPrincipal);
