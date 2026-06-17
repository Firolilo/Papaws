using Cassandra;

namespace Pawpaws.Consulta.Data;

public static class CassandraSchema
{
    public static async Task InitializeAsync(Cassandra.ISession session, string keyspace)
    {
        await session.ExecuteAsync(new SimpleStatement($"CREATE KEYSPACE IF NOT EXISTS {keyspace} WITH replication = {{ 'class': 'SimpleStrategy', 'replication_factor': 2 }}"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.veterinarios_by_id (
    id uuid PRIMARY KEY,
    nombre_completo text,
    telefono_contacto text,
    especialidad_principal text
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.servicios_by_id (
    id uuid PRIMARY KEY,
    nombre text,
    descripcion text,
    duracion_estimadaminutos int,
    precio_base decimal
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.productos_by_id (
    id uuid PRIMARY KEY,
    nombre text,
    tipo text,
    unidad_medida text,
    stock_disponible int
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.consultas_by_codigo (
    codigo text PRIMARY KEY,
    fecha_hora timestamp,
    estado text,
    observaciones text,
    diagnostico text,
    indicaciones_seguimiento text,
    animal_id uuid,
    veterinario_id uuid
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.consulta_servicios_by_codigo (
    codigo text,
    servicio_id uuid,
    PRIMARY KEY (codigo, servicio_id)
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.consulta_productos_by_codigo (
    codigo text,
    producto_id uuid,
    cantidad_usada int,
    PRIMARY KEY (codigo, producto_id)
)"));
    }
}