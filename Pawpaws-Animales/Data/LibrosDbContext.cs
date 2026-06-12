using Cassandra;

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
    zona_operacion text
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.animales_by_id (
    id uuid PRIMARY KEY,
    nombre text,
    especie text,
    peso_actual decimal,
    fecha_ingreso timestamp,
    rescatista_id uuid
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.animales_by_rescatista (
    rescatista_id uuid,
    id uuid,
    nombre text,
    especie text,
    peso_actual decimal,
    fecha_ingreso timestamp,
    PRIMARY KEY (rescatista_id, id)
)"));
    }
}