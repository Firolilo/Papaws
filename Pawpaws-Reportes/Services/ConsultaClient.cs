using System.Net;
using System.Net.Http.Json;
using Pawpaws.Reportes.DTOs.Externos;

namespace Pawpaws.Reportes.Services;

public class ConsultaClient : IConsultaClient
{
    private readonly HttpClient _httpClient;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ConsultaClient(HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
    {
        _httpClient = httpClient;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<List<ConsultaExternaDto>> GetConsultasAsync()
    {
        using var request = CrearRequest(HttpMethod.Get, "api/consultas?tamano=100");
        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var pagina = await response.Content.ReadFromJsonAsync<PaginaExternaDto<ConsultaExternaDto>>();
        return pagina?.Items ?? new();
    }

    public async Task<ConsultaExternaDto?> GetConsultaByCodigoAsync(string codigo)
    {
        using var request = CrearRequest(HttpMethod.Get, $"api/consultas/{codigo}");
        using var response = await _httpClient.SendAsync(request);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<ConsultaExternaDto>();
    }

    public async Task<List<ConsultaExternaDto>> GetConsultasByAnimalAsync(Guid animalId)
    {
        using var request = CrearRequest(HttpMethod.Get, $"api/consultas/animal/{animalId}");
        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<ConsultaExternaDto>>() ?? new();
    }

    public async Task<List<ConsultaExternaDto>> GetConsultasByVeterinarioAsync(Guid veterinarioId)
    {
        using var request = CrearRequest(HttpMethod.Get, $"api/consultas/veterinario/{veterinarioId}");
        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<ConsultaExternaDto>>() ?? new();
    }

    public async Task<List<ProductoUsadoExternoDto>> GetProductosByConsultaAsync(string codigo)
    {
        using var request = CrearRequest(HttpMethod.Get, $"api/consultas/{codigo}/productos");
        using var response = await _httpClient.SendAsync(request);
        if (response.StatusCode == HttpStatusCode.NotFound) return new();
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<ProductoUsadoExternoDto>>() ?? new();
    }

    public async Task<List<VeterinarioExternoDto>> GetVeterinariosAsync()
    {
        using var request = CrearRequest(HttpMethod.Get, "api/veterinarios?tamano=100");
        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var pagina = await response.Content.ReadFromJsonAsync<PaginaExternaDto<VeterinarioExternoDto>>();
        return pagina?.Items ?? new();
    }

    public async Task<VeterinarioExternoDto?> GetVeterinarioByIdAsync(Guid id)
    {
        using var request = CrearRequest(HttpMethod.Get, $"api/veterinarios/{id}");
        using var response = await _httpClient.SendAsync(request);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<VeterinarioExternoDto>();
    }

    public async Task<List<ServicioExternoDto>> GetServiciosAsync()
    {
        using var request = CrearRequest(HttpMethod.Get, "api/servicios?tamano=100");
        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var pagina = await response.Content.ReadFromJsonAsync<PaginaExternaDto<ServicioExternoDto>>();
        return pagina?.Items ?? new();
    }

    public async Task<ServicioExternoDto?> GetServicioByIdAsync(Guid id)
    {
        using var request = CrearRequest(HttpMethod.Get, $"api/servicios/{id}");
        using var response = await _httpClient.SendAsync(request);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<ServicioExternoDto>();
    }

    public async Task<List<ProductoExternoDto>> GetProductosAsync()
    {
        using var request = CrearRequest(HttpMethod.Get, "api/productos?tamano=100");
        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var pagina = await response.Content.ReadFromJsonAsync<PaginaExternaDto<ProductoExternoDto>>();
        return pagina?.Items ?? new();
    }

    public async Task<ProductoExternoDto?> GetProductoByIdAsync(Guid id)
    {
        using var request = CrearRequest(HttpMethod.Get, $"api/productos/{id}");
        using var response = await _httpClient.SendAsync(request);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<ProductoExternoDto>();
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
