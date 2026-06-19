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

        // Organizaciones base: se crean solas al arrancar (IDs fijos, idempotente) repartidas por
        // tipo, así el catálogo nunca queda vacío tras desplegar. El seed luego las vincula a los
        // rescatistas; un rescatista nuevo elige su organización de esta lista.
        var organizacionesBase = new (string Id, string Nombre, string Tipo)[]
        {
            ("a0000000-0000-0000-0000-000000000001", "Refugio Norte",         "Refugio"),
            ("a0000000-0000-0000-0000-000000000002", "Patitas Sur",           "ONG"),
            ("a0000000-0000-0000-0000-000000000003", "Refugio Este",          "Refugio"),
            ("a0000000-0000-0000-0000-000000000004", "Hogar Animal",          "Independiente"),
            ("a0000000-0000-0000-0000-000000000005", "Centro Canino",         "Autoridad ambiental"),
            ("a0000000-0000-0000-0000-000000000006", "Patas al Sur",          "Independiente"),
            ("a0000000-0000-0000-0000-000000000007", "Animal Rescue BA",      "ONG"),
            ("a0000000-0000-0000-0000-000000000008", "Fundación Vida Animal", "Autoridad ambiental"),
        };
        foreach (var (id, nombre, tipo) in organizacionesBase)
        {
            await session.ExecuteAsync(new SimpleStatement(
                $@"INSERT INTO {keyspace}.organizaciones_by_id (id, nombre, tipo, activo) VALUES (?, ?, ?, ?) IF NOT EXISTS",
                Guid.Parse(id), nombre, tipo, true));
        }

        // Auto-vinculación: a los rescatistas que ya existían (con organización como texto pero sin
        // organizacion_id) se les asigna la organización cuyo nombre coincide. Así no quedan sueltos
        // y aparecen en los reportes por organización/tipo, sin tener que re-sembrar.
        var orgsRows = await session.ExecuteAsync(new SimpleStatement(
            $"SELECT id, nombre, activo FROM {keyspace}.organizaciones_by_id"));
        var orgIdPorNombre = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        foreach (var or in orgsRows)
        {
            if (or.IsNull("activo") || or.GetValue<bool>("activo"))
                orgIdPorNombre[or.GetValue<string>("nombre")] = or.GetValue<Guid>("id");
        }

        var rescRows = await session.ExecuteAsync(new SimpleStatement(
            $"SELECT id, organizacion, organizacion_id FROM {keyspace}.rescatistas_by_id"));
        foreach (var r in rescRows)
        {
            if (!r.IsNull("organizacion_id")) continue;
            var nombreOrg = r.IsNull("organizacion") ? null : r.GetValue<string>("organizacion");
            if (nombreOrg is not null && orgIdPorNombre.TryGetValue(nombreOrg, out var oid))
            {
                await session.ExecuteAsync(new SimpleStatement(
                    $"UPDATE {keyspace}.rescatistas_by_id SET organizacion_id = ? WHERE id = ?",
                    oid, r.GetValue<Guid>("id")));
            }
        }

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

        // Historial de cambios de organización de cada rescatista (alta inicial + cada cambio).
        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.eventos_organizacion_by_rescatista (
    rescatista_id uuid,
    fecha timestamp,
    tipo text,
    org_anterior_id uuid,
    org_anterior_nombre text,
    org_nueva_id uuid,
    org_nueva_nombre text,
    PRIMARY KEY (rescatista_id, fecha)
) WITH CLUSTERING ORDER BY (fecha DESC)"));

        // Historial de custodia de cada animal (ingreso + reasignaciones entre rescatistas).
        await session.ExecuteAsync(new SimpleStatement($@"
CREATE TABLE IF NOT EXISTS {keyspace}.eventos_custodia_by_animal (
    animal_id uuid,
    fecha timestamp,
    tipo text,
    resc_anterior_id uuid,
    resc_anterior_nombre text,
    resc_nuevo_id uuid,
    resc_nuevo_nombre text,
    PRIMARY KEY (animal_id, fecha)
) WITH CLUSTERING ORDER BY (fecha DESC)"));

        await BackfillEventosAsync(session, keyspace);
    }

    /// <summary>
    /// Siembra eventos iniciales para los datos que ya existían, así la trazabilidad (custodia,
    /// organización, adopción) aparece completa sin esperar a un nuevo movimiento. Idempotente:
    /// solo crea el evento inicial si el registro todavía no tiene ninguno.
    /// </summary>
    private static async Task BackfillEventosAsync(Cassandra.ISession session, string keyspace)
    {
        // Mapa de nombres de rescatista (incluye dados de baja, para los snapshots).
        var nombrePorRescatista = new Dictionary<Guid, string>();
        foreach (var r in await session.ExecuteAsync(new SimpleStatement(
            $"SELECT id, nombre_completo FROM {keyspace}.rescatistas_by_id")))
        {
            nombrePorRescatista[r.GetValue<Guid>("id")] = r.GetValue<string>("nombre_completo");
        }

        // 1) Alta de organización para rescatistas ya vinculados sin historial.
        foreach (var r in await session.ExecuteAsync(new SimpleStatement(
            $"SELECT id, organizacion, organizacion_id FROM {keyspace}.rescatistas_by_id")))
        {
            if (r.IsNull("organizacion_id")) continue;
            var rescId = r.GetValue<Guid>("id");
            var yaTiene = (await session.ExecuteAsync(new SimpleStatement(
                $"SELECT fecha FROM {keyspace}.eventos_organizacion_by_rescatista WHERE rescatista_id = ? LIMIT 1", rescId))).Any();
            if (yaTiene) continue;
            await session.ExecuteAsync(new SimpleStatement(
                $"INSERT INTO {keyspace}.eventos_organizacion_by_rescatista (rescatista_id, fecha, tipo, org_anterior_id, org_anterior_nombre, org_nueva_id, org_nueva_nombre) VALUES (?, ?, 'Alta', null, null, ?, ?)",
                rescId, DateTime.UtcNow, r.GetValue<Guid>("organizacion_id"),
                r.IsNull("organizacion") ? string.Empty : r.GetValue<string>("organizacion")));
        }

        // 2) Ingreso (custodia) y adopción para animales sin historial.
        foreach (var a in await session.ExecuteAsync(new SimpleStatement(
            $"SELECT id, fecha_ingreso, rescatista_id, estado, fecha_salida, adoptante_rescatista_id FROM {keyspace}.animales_by_id")))
        {
            var animalId = a.GetValue<Guid>("id");
            var rescId = a.GetValue<Guid>("rescatista_id");
            var ingreso = a.IsNull("fecha_ingreso") ? DateTime.UtcNow : a.GetValue<DateTime>("fecha_ingreso");

            var tieneCustodia = (await session.ExecuteAsync(new SimpleStatement(
                $"SELECT fecha FROM {keyspace}.eventos_custodia_by_animal WHERE animal_id = ? LIMIT 1", animalId))).Any();
            if (!tieneCustodia)
            {
                await session.ExecuteAsync(new SimpleStatement(
                    $"INSERT INTO {keyspace}.eventos_custodia_by_animal (animal_id, fecha, tipo, resc_anterior_id, resc_anterior_nombre, resc_nuevo_id, resc_nuevo_nombre) VALUES (?, ?, 'Ingreso', null, null, ?, ?)",
                    animalId, ingreso, rescId,
                    nombrePorRescatista.TryGetValue(rescId, out var n) ? n : string.Empty));
            }

            // Adopción: solo si el animal está adoptado y no tiene historial de adopción.
            var estado = a.IsNull("estado") ? null : a.GetValue<string>("estado");
            if (estado == "Adoptado" && !a.IsNull("adoptante_rescatista_id"))
            {
                var tieneAdopcion = (await session.ExecuteAsync(new SimpleStatement(
                    $"SELECT fecha FROM {keyspace}.eventos_adopcion_by_animal WHERE animal_id = ? LIMIT 1", animalId))).Any();
                if (!tieneAdopcion)
                {
                    var fechaSalida = a.IsNull("fecha_salida") ? DateTime.UtcNow : a.GetValue<DateTime>("fecha_salida");
                    await session.ExecuteAsync(new SimpleStatement(
                        $"INSERT INTO {keyspace}.eventos_adopcion_by_animal (animal_id, fecha, tipo, rescatista_id, nota) VALUES (?, ?, 'Adoptado', ?, null)",
                        animalId, fechaSalida, a.GetValue<Guid>("adoptante_rescatista_id")));
                }
            }
        }
    }
}