using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace Pawpaws.Consulta.Services;

public class AnimalReferenceService : IAnimalReferenceService
{
    private const int MaxIntentos = 3;
    private readonly HttpClient _httpClient;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AnimalReferenceService(HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
    {
        _httpClient = httpClient;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<bool> ExisteAnimalAsync(Guid animalId)
    {
        // El endpoint de Animales exige autenticación, así que reenviamos el token del usuario.
        var authorization = _httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();

        for (int intento = 1; ; intento++)
        {
            // Una request nueva por intento (no se puede reenviar la misma instancia).
            using var request = new HttpRequestMessage(HttpMethod.Get, $"api/animales/{animalId}");
            if (!string.IsNullOrWhiteSpace(authorization))
            {
                request.Headers.TryAddWithoutValidation("Authorization", authorization);
            }

            try
            {
                using var response = await _httpClient.SendAsync(request);

                // 404 es una respuesta válida (el animal no existe), no se reintenta.
                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    return false;
                }

                if (response.IsSuccessStatusCode)
                {
                    return true;
                }

                // Errores 5xx: reintentar; en el último intento, propagar.
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

    public async Task<string?> ObtenerEstadoAsync(Guid animalId)
    {
        var authorization = _httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();

        for (int intento = 1; ; intento++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"api/animales/{animalId}");
            if (!string.IsNullOrWhiteSpace(authorization))
            {
                request.Headers.TryAddWithoutValidation("Authorization", authorization);
            }

            try
            {
                using var response = await _httpClient.SendAsync(request);

                // 404: el animal no existe.
                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    return null;
                }

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    return doc.RootElement.TryGetProperty("estado", out var estado)
                        ? estado.GetString() ?? string.Empty
                        : string.Empty;
                }

                if (intento >= MaxIntentos)
                {
                    response.EnsureSuccessStatusCode();
                }
            }
            catch (HttpRequestException) when (intento < MaxIntentos)
            {
            }
            catch (TaskCanceledException) when (intento < MaxIntentos)
            {
            }

            await Task.Delay(TimeSpan.FromMilliseconds(200 * intento));
        }
    }
}
