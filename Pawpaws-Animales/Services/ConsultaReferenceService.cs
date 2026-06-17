using Microsoft.AspNetCore.Http;

namespace Pawpaws.Animales.Services;

public class ConsultaReferenceService : IConsultaReferenceService
{
    private const int MaxIntentos = 3;
    private readonly HttpClient _httpClient;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ConsultaReferenceService(HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
    {
        _httpClient = httpClient;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task EliminarConsultasPorAnimalAsync(Guid animalId)
    {
        // El endpoint de Consulta exige autenticación, así que reenviamos el token del usuario.
        var authorization = _httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();

        for (int intento = 1; ; intento++)
        {
            // Una request nueva por intento (no se puede reenviar la misma instancia).
            using var request = new HttpRequestMessage(HttpMethod.Delete, $"api/consultas/animal/{animalId}");
            if (!string.IsNullOrWhiteSpace(authorization))
            {
                request.Headers.TryAddWithoutValidation("Authorization", authorization);
            }

            try
            {
                using var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    return;
                }

                // Errores 5xx: reintentar; en el último intento, propagar para no romper la cascada en silencio.
                if (intento >= MaxIntentos)
                {
                    response.EnsureSuccessStatusCode();
                }
            }
            catch (HttpRequestException) when (intento < MaxIntentos)
            {
                // Fallo de red transitorio: reintentar.
            }
            catch (TaskCanceledException) when (intento < MaxIntentos)
            {
                // Timeout transitorio: reintentar.
            }

            await Task.Delay(TimeSpan.FromMilliseconds(200 * intento));
        }
    }
}
