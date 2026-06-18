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

## Notas

- El modelo de autenticación actual es de demostración (usuarios semilla + contraseña genérica
  única). Para producción real falta gestión de usuarios con hash de contraseñas por usuario.
- El frontend (`Pawpaws-Front/.env`) solo contiene URLs públicas, por eso sí se versiona.
