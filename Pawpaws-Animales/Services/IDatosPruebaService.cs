using Pawpaws.Animales.DTOs;

namespace Pawpaws.Animales.Services;

public interface IDatosPruebaService
{
    Task<ResultadoCargaDto> GenerarDatosAsync(int cantidad);
}