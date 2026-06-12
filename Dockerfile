# Multi-stage Dockerfile that builds both microservices and runs them together.
# Adjust base images if you target a different .NET SDK/runtime (e.g. .NET 10).

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy both projects
COPY Pawpaws-Animales/ Pawpaws-Animales/
COPY Pawpaws-Consulta/ Pawpaws-Consulta/

# Restore and publish each project
RUN dotnet restore Pawpaws-Animales/LibrosService.csproj \
    && dotnet restore Pawpaws-Consulta/LibrosService.csproj

RUN dotnet publish Pawpaws-Animales/LibrosService.csproj -c Release -o /app/animales
RUN dotnet publish Pawpaws-Consulta/LibrosService.csproj -c Release -o /app/consulta

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Copy published outputs
COPY --from=build /app/animales ./animales
COPY --from=build /app/consulta ./consulta

# Add startup script
COPY start-services.sh /app/start-services.sh
RUN chmod +x /app/start-services.sh

# Expose ports for both services (adjust if your apps use different ports)
EXPOSE 8080 8081

CMD ["/app/start-services.sh"]
