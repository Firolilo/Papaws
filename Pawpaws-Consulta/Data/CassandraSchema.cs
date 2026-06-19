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
    especialidad_principal text,
    activo boolean
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.servicios_by_id (
    id uuid PRIMARY KEY,
    nombre text,
    descripcion text,
    duracion_estimadaminutos int,
    precio_base decimal,
    activo boolean
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.productos_by_id (
    id uuid PRIMARY KEY,
    nombre text,
    tipo text,
    unidad_medida text,
    stock_disponible int,
    fecha_vencimiento timestamp,
    activo boolean
)"));

        // Migración para keyspaces creados antes de incorporar el borrado lógico.
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.veterinarios_by_id ADD IF NOT EXISTS activo boolean"));
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.servicios_by_id ADD IF NOT EXISTS activo boolean"));
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.productos_by_id ADD IF NOT EXISTS activo boolean"));
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.productos_by_id ADD IF NOT EXISTS fecha_vencimiento timestamp"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.consultas_by_codigo (
    codigo text PRIMARY KEY,
    fecha_hora timestamp,
    estado text,
    observaciones text,
    diagnostico text,
    indicaciones_seguimiento text,
    tratamiento text,
    amerita_tratamiento boolean,
    proximo_control timestamp,
    peso decimal,
    temperatura decimal,
    condicion_corporal text,
    animal_id uuid,
    veterinario_id uuid
)"));

        // Migración: signos clínicos y tratamiento por consulta (keyspaces antiguos).
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.consultas_by_codigo ADD IF NOT EXISTS peso decimal"));
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.consultas_by_codigo ADD IF NOT EXISTS temperatura decimal"));
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.consultas_by_codigo ADD IF NOT EXISTS condicion_corporal text"));
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.consultas_by_codigo ADD IF NOT EXISTS tratamiento text"));
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.consultas_by_codigo ADD IF NOT EXISTS amerita_tratamiento boolean"));
        await session.ExecuteAsync(new SimpleStatement($"ALTER TABLE {keyspace}.consultas_by_codigo ADD IF NOT EXISTS proximo_control timestamp"));

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

        // Tablas-puntero para consultar consultas por animal / veterinario sin ALLOW FILTERING.
        // Guardan solo el código (inmutable), así no requieren sincronización al cambiar estado/fecha.
        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.consulta_codigos_by_animal (
    animal_id uuid,
    codigo text,
    PRIMARY KEY (animal_id, codigo)
)"));

        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.consulta_codigos_by_veterinario (
    veterinario_id uuid,
    codigo text,
    PRIMARY KEY (veterinario_id, codigo)
)"));

        // Índice inverso servicio→consultas: permite listar en qué consultas se usó un servicio.
        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.consulta_codigos_by_servicio (
    servicio_id uuid,
    codigo text,
    PRIMARY KEY (servicio_id, codigo)
)"));

        // Backfill idempotente: reconstruye el índice inverso a partir de la relación
        // consulta→servicios ya existente (INSERT con misma PK es sobrescritura, no duplica).
        foreach (var fila in await session.ExecuteAsync(new SimpleStatement(
            $"SELECT codigo, servicio_id FROM {keyspace}.consulta_servicios_by_codigo")))
        {
            await session.ExecuteAsync(new SimpleStatement(
                $"INSERT INTO {keyspace}.consulta_codigos_by_servicio (servicio_id, codigo) VALUES (?, ?)",
                fila.GetValue<Guid>("servicio_id"), fila.GetValue<string>("codigo")));
        }
    }
}