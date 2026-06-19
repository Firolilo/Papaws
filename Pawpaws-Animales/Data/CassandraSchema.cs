using Cassandra;
using Pawpaws.Animales.Models;

namespace Pawpaws.Animales.Data;

public static class CassandraSchema
{
    public static async Task InitializeAsync(Cassandra.ISession session, string keyspace)
    {
        await session.ExecuteAsync(new SimpleStatement($"CREATE KEYSPACE IF NOT EXISTS {keyspace} WITH replication = {{ 'class': 'SimpleStrategy', 'replication_factor': 2 }}"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.rescatistas_by_id (
    id uuid PRIMARY KEY,
    nombre_completo text,
    telefono_contacto text,
    correo_electronico text,
    organizacion text,
    organizacion_id uuid,
    zona_operacion text,
    activo boolean,
    oculto boolean
)"));

        // Migración para keyspaces creados antes de incorporar el borrado lógico / el rescatista oculto.
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.rescatistas_by_id ADD IF NOT EXISTS activo boolean"));
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.rescatistas_by_id ADD IF NOT EXISTS oculto boolean"));
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.rescatistas_by_id ADD IF NOT EXISTS organizacion_id uuid"));

        // Catálogo de organizaciones (cada rescatista pertenece a una).
        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.organizaciones_by_id (
    id uuid PRIMARY KEY,
    nombre text,
    tipo text,
    activo boolean
)"));

        // Rescatista interno "Refugio": destino por defecto al eliminar un rescatista. Siempre existe.
        await session.ExecuteAsync(new SimpleStatement(
            $@"INSERT INTO {keyspace}.rescatistas_by_id (id, nombre_completo, telefono_contacto, correo_electronico, organizacion, zona_operacion, activo, oculto) VALUES (?, ?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS",
            Rescatista.RefugioId, "Refugio", "—", "—", "Refugio interno", "—", true, true));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.animales_by_id (
    id uuid PRIMARY KEY,
    nombre text,
    especie text,
    peso_actual decimal,
    fecha_ingreso timestamp,
    rescatista_id uuid,
    estado text,
    fecha_salida timestamp,
    adoptante_rescatista_id uuid
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.animales_by_rescatista (
    rescatista_id uuid,
    id uuid,
    nombre text,
    especie text,
    peso_actual decimal,
    fecha_ingreso timestamp,
    estado text,
    fecha_salida timestamp,
    adoptante_rescatista_id uuid,
    PRIMARY KEY (rescatista_id, id)
)"));

        // Migración: estado de adopción (keyspaces creados antes de incorporarlo).
        foreach (var tabla in new[] { "animales_by_id", "animales_by_rescatista" })
        {
            await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.{tabla} ADD IF NOT EXISTS estado text"));
            await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.{tabla} ADD IF NOT EXISTS fecha_salida timestamp"));
            await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.{tabla} ADD IF NOT EXISTS adoptante_rescatista_id uuid"));
        }

        // Historial de adopciones/devoluciones: cada movimiento es un evento inmutable. Así una
        // devolución NO borra que el animal estuvo adoptado y soporta múltiples ciclos.
        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.eventos_adopcion_by_animal (
    animal_id uuid,
    fecha timestamp,
    tipo text,
    rescatista_id uuid,
    nota text,
    PRIMARY KEY (animal_id, fecha)
) WITH CLUSTERING ORDER BY (fecha DESC)"));
    }
}