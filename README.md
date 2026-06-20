# Papaws

Sistema de gestión para veterinaria/refugio. Microservicios .NET 10 + Cassandra y frontend React.

| Servicio | Puerto | Responsabilidad |
|----------|--------|-----------------|
| `Pawpaws-Animales`  | 8080 | Animales, rescatistas, **autenticación (login + emisión de JWT)** |
| `Pawpaws-Consulta`  | 8081 | Consultas, veterinarios, servicios, productos/stock |
| `Pawpaws-Reportes`  | 8082 | Reportes de solo lectura sobre los otros dos |
| `Pawpaws-Front`     | 5173 | SPA (Vite + React) |

## Configuración de secretos

Los secretos **no se versionan**. `appsettings.json` los deja vacíos y la app **falla al arrancar**
si no se proveen (fail-fast). Hay que inyectarlos según el entorno:

### Docker Compose (forma recomendada para correr todo)

```bash
cp .env.example .env   # completá los valores; .env está en .gitignore
docker compose up --build
```

`docker-compose.yml` toma `PAPAWS_JWT_KEY` y `PAPAWS_PASSWORD_GENERICA` del `.env`.
Si falta alguna, Compose aborta con un mensaje claro.

### Local con `dotnet run` (sin Docker)

Cada proyecto usa [User Secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets)
(se guardan en tu perfil, fuera del repo). Para configurarlos:

```bash
cd Pawpaws-Animales
dotnet user-secrets set "Auth:Jwt:Key" "<clave-de-al-menos-32-caracteres>"
dotnet user-secrets set "Auth:PasswordGenerica" "<password-dev>"

cd ../Pawpaws-Consulta
dotnet user-secrets set "Auth:Jwt:Key" "<la-misma-clave>"

cd ../Pawpaws-Reportes
dotnet user-secrets set "Auth:Jwt:Key" "<la-misma-clave>"
```

> La clave JWT debe ser **idéntica en los tres servicios** (Animales firma, los demás validan)
> y tener **al menos 32 caracteres** (256 bits, requisito de HMAC-SHA256).

### Producción

Inyectá las variables `Auth__Jwt__Key` y `Auth__PasswordGenerica` por el mecanismo de secretos
de la plataforma (variables de entorno, Key Vault, etc.). **Nunca** reutilices la clave de desarrollo;
generá una nueva: `openssl rand -base64 48`.

## Usuarios y login (demo)

La autenticación es de demostración: hay **3 usuarios fijos** (en `Pawpaws-Animales/appsettings.json`,
sección `Auth:Usuarios`) que entran todos con **una única contraseña genérica** (`PAPAWS_PASSWORD_GENERICA`).
No hay seed de usuarios en la base; `/api/seed` solo siembra organizaciones, rescatistas y animales.

| Correo | Rol |
|--------|-----|
| `admin@papaws.com`       | Administrador |
| `consultas@papaws.com`   | EncargadoConsultas |
| `rescatistas@papaws.com` | EncargadoRescatistas |

> El botón "Acceso rápido (demo)" del front usa la contraseña `papaws123`. Para que funcione,
> definí `PAPAWS_PASSWORD_GENERICA=papaws123` en tu `.env` (o iniciá sesión a mano con el valor
> que hayas puesto en esa variable).

## Manejo de contenedores (Docker)

Corré todo desde la raíz del repo. Conviene usar `docker compose` (referís a los servicios por su
**nombre de servicio**). Los servicios son: `papaws-animales`, `papaws-consulta`, `papaws-reportes`,
`cassandra-animales`, `cassandra-consulta`. El frontend (`:5173`) **no está en Docker**: corre aparte
con `npm run dev`.

```bash
# Estado y logs
docker compose ps                          # estado de todos los servicios
docker compose logs -f papaws-animales     # logs en vivo de un servicio
docker compose logs --tail=50 papaws-consulta

# Apagar / encender / reiniciar (conserva contenedor y datos)
docker compose stop papaws-consulta        # parar un servicio
docker compose start papaws-consulta       # encenderlo
docker compose restart papaws-animales     # reiniciar
docker compose stop                        # parar todo
docker compose start                       # encender todo

# Levantar
docker compose up -d                       # levanta lo que falte (en segundo plano)
docker compose up -d --build               # reconstruye imágenes (tras cambiar código .NET)
docker compose up -d papaws-consulta       # un solo servicio

# Eliminar
docker compose down                        # para y elimina contenedores + red (los datos quedan)
docker compose down -v                     # ⚠️ además BORRA los volúmenes Cassandra (BD desde cero)
docker compose rm -sf papaws-reportes      # eliminar un solo contenedor

# Simular partición de red (contenedor "vivo" pero inalcanzable; usa nombre de CONTENEDOR)
docker network disconnect papaws_default papaws-consulta
docker network connect    papaws_default papaws-consulta
```

### Qué se rompe al tumbar cada pieza (para demos de tolerancia a fallos)

| Apagás | Comando | Efecto |
|--------|---------|--------|
| **Animales** (`:8080`) | `docker compose stop papaws-animales` | Se cae **todo el login** (la auth vive acá). Punto único de fallo más fuerte. |
| **Consulta** (`:8081`) | `docker compose stop papaws-consulta` | Login y Animales/Rescatistas siguen OK. Se rompen Consultas, Veterinarios, Servicios, Productos, Gastos. |
| **Reportes** (`:8082`) | `docker compose stop papaws-reportes` | Todo funciona menos la pantalla de Reportes. |
| **1 nodo Cassandra** | `docker compose stop cassandra-consulta` | Gracias a `replication_factor: 2`, el otro nodo tiene copia de ambos keyspaces y la app sigue. Para una caída total de datos hay que tumbar **los dos** nodos. |

## Acceso a Cassandra (cqlsh)

Hay **dos nodos** que forman un único clúster (`papaws-cluster`); cada servicio es dueño de su
keyspace, pero con `replication_factor: 2` ambos keyspaces se replican en los dos nodos. En Docker
ambos usan el puerto interno `9042` (hacia afuera se publican como `9042` y `9142`).

```bash
# Entrar a la shell interactiva
docker exec -it papaws-cassandra-animales cqlsh   # keyspace papaws_animales
docker exec -it papaws-cassandra-consulta cqlsh   # keyspace papaws_consulta

# Consultas de una línea (sin entrar a la shell)
docker exec -it papaws-cassandra-animales cqlsh -e "SELECT * FROM papaws_animales.animales_by_id LIMIT 10;"
docker exec -it papaws-cassandra-consulta cqlsh -e "SELECT * FROM papaws_consulta.consultas_by_codigo LIMIT 5;"
```

Dentro de `cqlsh`:

```sql
DESCRIBE KEYSPACES;                              -- listar keyspaces
USE papaws_animales;                             -- seleccionar keyspace
DESCRIBE TABLES;                                 -- listar tablas
DESCRIBE TABLE animales_by_id;                   -- ver estructura de una tabla
SELECT * FROM animales_by_id LIMIT 10;
SELECT count(*) FROM animales_by_id;
-- Filtrar por columna que no es clave primaria (lento, solo para explorar):
SELECT * FROM animales_by_id WHERE especie = 'Gato' ALLOW FILTERING;
```

Tablas principales:

| `papaws_animales` (nodo `papaws-cassandra-animales`) | `papaws_consulta` (nodo `papaws-cassandra-consulta`) |
|------------------------------------------------------|------------------------------------------------------|
| `animales_by_id`, `animales_by_rescatista`           | `consultas_by_codigo`, `consulta_codigos_by_animal`  |
| `rescatistas_by_id`, `organizaciones_by_id`          | `consulta_codigos_by_veterinario` / `_by_servicio`   |
| `eventos_adopcion_by_animal`                         | `consulta_servicios_by_codigo` / `_productos_by_codigo` |
| `eventos_custodia_by_animal`                         | `veterinarios_by_id`, `servicios_by_id`, `productos_by_id` |
| `eventos_organizacion_by_rescatista`                 |                                                      |

> Cassandra **no es SQL relacional**: no hay `JOIN`. Por eso hay tablas duplicadas tipo `_by_id`,
> `_by_rescatista`, etc. (una tabla por cada forma de consultar). Las referencias entre servicios se
> guardan como `Guid` planos (sin clave foránea) y se validan por API HTTP, no por la base.

## Notas

- El modelo de autenticación actual es de demostración (usuarios semilla + contraseña genérica
  única). Para producción real falta gestión de usuarios con hash de contraseñas por usuario.
- El frontend (`Pawpaws-Front/.env`) solo contiene URLs públicas, por eso sí se versiona.
