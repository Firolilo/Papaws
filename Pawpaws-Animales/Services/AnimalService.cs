using Cassandra;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Services;

public class AnimalService : IAnimalService
{
    private readonly Cassandra.ISession _session;
    private readonly IRescatistaService _rescatistaService;
    private readonly PreparedStatement _insertByIdStatement;
    private readonly PreparedStatement _insertByRescatistaStatement;
    private readonly PreparedStatement _deleteByRescatistaStatement;
    private readonly PreparedStatement _deleteByIdStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByIdStatement;
    private readonly PreparedStatement _selectByRescatistaStatement;

    public AnimalService(Cassandra.ISession session, IRescatistaService rescatistaService)
    {
        _session = session;
        _rescatistaService = rescatistaService;
        _insertByIdStatement = _session.Prepare("INSERT INTO animales_by_id (id, nombre, especie, peso_actual, fecha_ingreso, rescatista_id) VALUES (?, ?, ?, ?, ?, ?)");
        _insertByRescatistaStatement = _session.Prepare("INSERT INTO animales_by_rescatista (rescatista_id, id, nombre, especie, peso_actual, fecha_ingreso) VALUES (?, ?, ?, ?, ?, ?)");
        _deleteByRescatistaStatement = _session.Prepare("DELETE FROM animales_by_rescatista WHERE rescatista_id = ? AND id = ?");
        _deleteByIdStatement = _session.Prepare("DELETE FROM animales_by_id WHERE id = ?");
        _selectAllStatement = _session.Prepare("SELECT id, nombre, especie, peso_actual, fecha_ingreso, rescatista_id FROM animales_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre, especie, peso_actual, fecha_ingreso, rescatista_id FROM animales_by_id WHERE id = ?");
        _selectByRescatistaStatement = _session.Prepare("SELECT id, nombre, especie, peso_actual, fecha_ingreso, rescatista_id FROM animales_by_rescatista WHERE rescatista_id = ?");
    }

    public async Task<List<Animal>> ObtenerTodosAsync()
    {
        var rows = await _session.ExecuteAsync(_selectAllStatement.Bind());
        return rows.Select(MapearAnimal).OrderBy(animal => animal.Nombre).ToList();
    }

    public async Task<Animal?> ObtenerPorIdAsync(Guid id)
    {
        var rows = await _session.ExecuteAsync(_selectByIdStatement.Bind(id));
        return rows.FirstOrDefault() is Row row ? MapearAnimal(row) : null;
    }

    public async Task<List<Animal>> ObtenerPorRescatistaAsync(Guid rescatistaId)
    {
        var rows = await _session.ExecuteAsync(_selectByRescatistaStatement.Bind(rescatistaId));
        return rows.Select(MapearAnimal).OrderBy(animal => animal.Nombre).ToList();
    }

    public async Task<Animal> CrearAsync(CrearAnimalDto dto)
    {
        var rescatista = await _rescatistaService.ObtenerPorIdAsync(dto.RescatistaId);
        if (rescatista is null)
        {
            throw new InvalidOperationException("El rescatista asociado no existe.");
        }

        var animal = new Animal
        {
            Id = Guid.NewGuid(),
            Nombre = dto.Nombre,
            Especie = dto.Especie,
            PesoActual = dto.PesoActual,
            FechaIngreso = DateTime.UtcNow,
            RescatistaId = dto.RescatistaId
        };

        await GuardarAnimalAsync(animal);
        return animal;
    }

    public async Task<bool> ActualizarAsync(Guid id, ActualizarAnimalDto dto)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null)
        {
            return false;
        }

        var rescatista = await _rescatistaService.ObtenerPorIdAsync(dto.RescatistaId);
        if (rescatista is null)
        {
            throw new InvalidOperationException("El rescatista asociado no existe.");
        }

        var rescatistaAnterior = actual.RescatistaId;

        actual.Nombre = dto.Nombre;
        actual.Especie = dto.Especie;
        actual.PesoActual = dto.PesoActual;
        actual.RescatistaId = dto.RescatistaId;

        var batch = new BatchStatement();
        // Si cambió de rescatista, eliminamos la fila vieja de la tabla por rescatista.
        if (rescatistaAnterior != actual.RescatistaId)
        {
            batch.Add(_deleteByRescatistaStatement.Bind(rescatistaAnterior, actual.Id));
        }
        AgregarUpsert(batch, actual);
        await _session.ExecuteAsync(batch);
        return true;
    }

    public async Task<bool> EliminarAsync(Guid id)
    {
        var actual = await ObtenerPorIdAsync(id);
        if (actual is null)
        {
            return false;
        }

        // Borrado físico: el animal es dato propio, no referencia compartida.
        // Se limpian ambas tablas (by_id y by_rescatista) en una sola operación.
        var batch = new BatchStatement();
        batch.Add(_deleteByIdStatement.Bind(actual.Id));
        batch.Add(_deleteByRescatistaStatement.Bind(actual.RescatistaId, actual.Id));
        await _session.ExecuteAsync(batch);
        return true;
    }

    private async Task GuardarAnimalAsync(Animal animal)
    {
        var batch = new BatchStatement();
        AgregarUpsert(batch, animal);
        await _session.ExecuteAsync(batch);
    }

    // Mantiene sincronizadas ambas tablas (by_id y by_rescatista) en una sola operación atómica.
    private void AgregarUpsert(BatchStatement batch, Animal animal)
    {
        batch.Add(_insertByIdStatement.Bind(animal.Id, animal.Nombre, animal.Especie, animal.PesoActual, animal.FechaIngreso, animal.RescatistaId));
        batch.Add(_insertByRescatistaStatement.Bind(animal.RescatistaId, animal.Id, animal.Nombre, animal.Especie, animal.PesoActual, animal.FechaIngreso));
    }

    private static Animal MapearAnimal(Row row)
    {
        return new Animal
        {
            Id = row.GetValue<Guid>("id"),
            Nombre = row.GetValue<string>("nombre"),
            Especie = row.GetValue<string>("especie"),
            PesoActual = row.GetValue<decimal>("peso_actual"),
            FechaIngreso = row.GetValue<DateTime>("fecha_ingreso"),
            RescatistaId = row.GetValue<Guid>("rescatista_id")
        };
    }
}