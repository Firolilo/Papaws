using Cassandra;
using Pawpaws.Animales.DTOs;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Services;

public class AnimalService : IAnimalService
{
    private readonly Cassandra.ISession _session;
    private readonly IRescatistaService _rescatistaService;
    private readonly IConsultaReferenceService _consultaReferenceService;
    private readonly PreparedStatement _insertByIdStatement;
    private readonly PreparedStatement _insertByRescatistaStatement;
    private readonly PreparedStatement _deleteByRescatistaStatement;
    private readonly PreparedStatement _deleteByIdStatement;
    private readonly PreparedStatement _selectAllStatement;
    private readonly PreparedStatement _selectByIdStatement;
    private readonly PreparedStatement _selectByRescatistaStatement;
    private readonly PreparedStatement _insertEventoAdopcionStatement;
    private readonly PreparedStatement _selectEventosAdopcionStatement;

    public AnimalService(Cassandra.ISession session, IRescatistaService rescatistaService, IConsultaReferenceService consultaReferenceService)
    {
        _session = session;
        _rescatistaService = rescatistaService;
        _consultaReferenceService = consultaReferenceService;
        _insertByIdStatement = _session.Prepare("INSERT INTO animales_by_id (id, nombre, especie, peso_actual, fecha_ingreso, rescatista_id, estado, fecha_salida, adoptante_rescatista_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        _insertByRescatistaStatement = _session.Prepare("INSERT INTO animales_by_rescatista (rescatista_id, id, nombre, especie, peso_actual, fecha_ingreso, estado, fecha_salida, adoptante_rescatista_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        _deleteByRescatistaStatement = _session.Prepare("DELETE FROM animales_by_rescatista WHERE rescatista_id = ? AND id = ?");
        _deleteByIdStatement = _session.Prepare("DELETE FROM animales_by_id WHERE id = ?");
        _selectAllStatement = _session.Prepare("SELECT id, nombre, especie, peso_actual, fecha_ingreso, rescatista_id, estado, fecha_salida, adoptante_rescatista_id FROM animales_by_id");
        _selectByIdStatement = _session.Prepare("SELECT id, nombre, especie, peso_actual, fecha_ingreso, rescatista_id, estado, fecha_salida, adoptante_rescatista_id FROM animales_by_id WHERE id = ?");
        _selectByRescatistaStatement = _session.Prepare("SELECT id, nombre, especie, peso_actual, fecha_ingreso, rescatista_id, estado, fecha_salida, adoptante_rescatista_id FROM animales_by_rescatista WHERE rescatista_id = ?");
        _insertEventoAdopcionStatement = _session.Prepare("INSERT INTO eventos_adopcion_by_animal (animal_id, fecha, tipo, rescatista_id, nota) VALUES (?, ?, ?, ?, ?)");
        _selectEventosAdopcionStatement = _session.Prepare("SELECT animal_id, fecha, tipo, rescatista_id, nota FROM eventos_adopcion_by_animal WHERE animal_id = ?");
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

        // Cascada cross-servicio: primero se eliminan las consultas del animal en el servicio
        // de Consulta. Si esto falla, se propaga y el animal NO se borra (evita huérfanos).
        await _consultaReferenceService.EliminarConsultasPorAnimalAsync(actual.Id);

        // Borrado físico: el animal es dato propio, no referencia compartida.
        // Se limpian ambas tablas (by_id y by_rescatista) en una sola operación.
        var batch = new BatchStatement();
        batch.Add(_deleteByIdStatement.Bind(actual.Id));
        batch.Add(_deleteByRescatistaStatement.Bind(actual.RescatistaId, actual.Id));
        await _session.ExecuteAsync(batch);
        return true;
    }

    public async Task<int> ReasignarAnimalesAsync(Guid origenRescatistaId, Guid destinoRescatistaId)
    {
        if (origenRescatistaId == destinoRescatistaId)
        {
            return 0;
        }

        var animales = await ObtenerPorRescatistaAsync(origenRescatistaId);
        foreach (var animal in animales)
        {
            // Quitar la fila del rescatista origen y re-escribir el animal con el nuevo rescatista
            // en ambas tablas (by_id y by_rescatista), de forma atómica por animal.
            var batch = new BatchStatement();
            batch.Add(_deleteByRescatistaStatement.Bind(origenRescatistaId, animal.Id));
            animal.RescatistaId = destinoRescatistaId;
            AgregarUpsert(batch, animal);
            await _session.ExecuteAsync(batch);
        }

        return animales.Count;
    }

    private static readonly string[] EstadosValidos = { "Disponible", "EnTratamiento", "Adoptado", "Devuelto" };

    public async Task<bool> RegistrarEstadoAsync(Guid id, string estado, DateTime? fechaSalida, Guid? adoptanteRescatistaId, string? nota)
    {
        var animal = await ObtenerPorIdAsync(id);
        if (animal is null)
        {
            return false;
        }

        var normalizado = EstadosValidos.FirstOrDefault(e => e.Equals(estado, StringComparison.OrdinalIgnoreCase));
        if (normalizado is null)
        {
            throw new InvalidOperationException($"Estado inválido. Debe ser uno de: {string.Join(", ", EstadosValidos)}.");
        }

        if (normalizado == "Adoptado")
        {
            // Marcar adoptado exige saber quién se lo llevó (el refugio solo registra la salida).
            if (adoptanteRescatistaId is null)
            {
                throw new InvalidOperationException("Para marcar como adoptado se debe indicar el rescatista que se llevó al animal.");
            }
            if (await _rescatistaService.ObtenerPorIdAsync(adoptanteRescatistaId.Value) is null)
            {
                throw new InvalidOperationException("El rescatista indicado no existe.");
            }

            var fecha = fechaSalida ?? DateTime.UtcNow;
            animal.Estado = "Adoptado";
            animal.FechaSalida = fecha;
            animal.AdoptanteRescatistaId = adoptanteRescatistaId;
            // Queda asentado en el historial (no se pisa: cada adopción es un evento nuevo).
            await RegistrarEventoAdopcionAsync(id, fecha, "Adoptado", adoptanteRescatistaId, nota);
        }
        else if (normalizado == "Devuelto")
        {
            // Solo se puede devolver lo que está adoptado. La adopción previa NO se borra:
            // se conserva en el historial y se agrega el evento de devolución.
            if (!animal.Estado.Equals("Adoptado", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Solo se puede registrar la devolución de un animal que está adoptado.");
            }

            var fecha = fechaSalida ?? DateTime.UtcNow;
            await RegistrarEventoAdopcionAsync(id, fecha, "Devuelto", animal.AdoptanteRescatistaId, nota);
            // El animal vuelve al refugio: queda como devuelto (a la espera de revisión) y se
            // limpian los datos de adopción "vigente" — la historia ya quedó en los eventos.
            animal.Estado = "Devuelto";
            animal.FechaSalida = null;
            animal.AdoptanteRescatistaId = null;
        }
        else
        {
            // Disponible / EnTratamiento: estados internos del refugio. No tocan el historial.
            animal.Estado = normalizado;
            animal.FechaSalida = null;
            animal.AdoptanteRescatistaId = null;
        }

        var batch = new BatchStatement();
        AgregarUpsert(batch, animal);
        await _session.ExecuteAsync(batch);
        return true;
    }

    private async Task RegistrarEventoAdopcionAsync(Guid animalId, DateTime fecha, string tipo, Guid? rescatistaId, string? nota)
    {
        await _session.ExecuteAsync(_insertEventoAdopcionStatement.Bind(animalId, fecha, tipo, rescatistaId, nota));
    }

    public async Task<List<EventoAdopcion>> ObtenerEventosAdopcionAsync(Guid animalId)
    {
        var rows = await _session.ExecuteAsync(_selectEventosAdopcionStatement.Bind(animalId));
        return rows.Select(row => new EventoAdopcion
        {
            AnimalId = row.GetValue<Guid>("animal_id"),
            Fecha = row.GetValue<DateTime>("fecha"),
            Tipo = row.GetValue<string>("tipo"),
            RescatistaId = row.IsNull("rescatista_id") ? null : row.GetValue<Guid>("rescatista_id"),
            Nota = row.IsNull("nota") ? null : row.GetValue<string>("nota")
        }).ToList();
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
        batch.Add(_insertByIdStatement.Bind(animal.Id, animal.Nombre, animal.Especie, animal.PesoActual, animal.FechaIngreso, animal.RescatistaId, animal.Estado, animal.FechaSalida, animal.AdoptanteRescatistaId));
        batch.Add(_insertByRescatistaStatement.Bind(animal.RescatistaId, animal.Id, animal.Nombre, animal.Especie, animal.PesoActual, animal.FechaIngreso, animal.Estado, animal.FechaSalida, animal.AdoptanteRescatistaId));
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
            RescatistaId = row.GetValue<Guid>("rescatista_id"),
            // Filas previas a la migración no tienen estado → se consideran Disponibles.
            Estado = row.IsNull("estado") ? "Disponible" : row.GetValue<string>("estado"),
            FechaSalida = row.IsNull("fecha_salida") ? null : row.GetValue<DateTime>("fecha_salida"),
            AdoptanteRescatistaId = row.IsNull("adoptante_rescatista_id") ? null : row.GetValue<Guid>("adoptante_rescatista_id")
        };
    }
}