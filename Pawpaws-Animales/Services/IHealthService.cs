using Pawpaws.Animales.DTOs;

namespace Pawpaws.Animales.Services;

public interface IHealthService
{
    HealthResponseDto ObtenerEstado();
}