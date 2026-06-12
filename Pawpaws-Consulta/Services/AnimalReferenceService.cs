namespace Pawpaws.Consulta.Services;

public class AnimalReferenceService : IAnimalReferenceService
{
    private readonly HttpClient _httpClient;

    public AnimalReferenceService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<bool> ExisteAnimalAsync(Guid animalId)
    {
        var response = await _httpClient.GetAsync($"api/animales/{animalId}");
        return response.IsSuccessStatusCode;
    }
}