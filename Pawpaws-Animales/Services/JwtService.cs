using Pawpaws.Animales.DTOs;

namespace Pawpaws.Animales.Services;

public class HealthService : IHealthService
{
    public HealthResponseDto ObtenerEstado()
    {
        return new HealthResponseDto("ok", DateTime.UtcNow);
    }
}