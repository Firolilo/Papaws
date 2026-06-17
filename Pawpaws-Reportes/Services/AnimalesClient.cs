using System.Net;
using System.Net.Http.Json;
using Pawpaws.Reportes.DTOs.Externos;

namespace Pawpaws.Reportes.Services;

public class AnimalesClient : IAnimalesClient
{
    private readonly HttpClient _httpClient;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AnimalesClient(HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
    {
        _httpClient = httpClient;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<List<AnimalExternoDto>> GetAnimalesAsync()
    {
        using var request = CrearRequest(HttpMethod.Get, "api/animales?tamano=100");
        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var pagina = await response.Content.ReadFromJsonAsync<PaginaExternaDto<AnimalExternoDto>>();
        return pagina?.Items ?? new();
    }

    public async Task<AnimalExternoDto?> GetAnimalByIdAsync(Guid id)
    {
        using var request = CrearRequest(HttpMethod.Get, $"api/animales/{id}");
        using var response = await _httpClient.SendAsync(request);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AnimalExternoDto>();
    }

    public async Task<List<AnimalExternoDto>> GetAnimalesByRescatistaAsync(Guid rescatistaId)
    {
        using var request = CrearRequest(HttpMethod.Get, $"api/animales/rescatista/{rescatistaId}");
        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<AnimalExternoDto>>() ?? new();
    }

    public async Task<List<RescatistaExternoDto>> GetRescatistasAsync()
    {
        using var request = CrearRequest(HttpMethod.Get, "api/rescatistas?tamano=100");
        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var pagina = await response.Content.ReadFromJsonAsync<PaginaExternaDto<RescatistaExternoDto>>();
        return pagina?.Items ?? new();
    }

    public async Task<RescatistaExternoDto?> GetRescatistaByIdAsync(Guid id)
    {
        using var request = CrearRequest(HttpMethod.Get, $"api/rescatistas/{id}");
        using var response = await _httpClient.SendAsync(request);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<RescatistaExternoDto>();
    }

    private HttpRequestMessage CrearRequest(HttpMethod method, string url)
    {
        var request = new HttpRequestMessage(method, url);
        var authorization = _httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();
        if (!string.IsNullOrWhiteSpace(authorization))
        {
            request.Headers.TryAddWithoutValidation("Authorization", authorization);
        }
        return request;
    }
}
