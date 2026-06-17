FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . ./

RUN dotnet restore Pawpaws-Consulta/Pawpaws.Consulta.csproj
RUN dotnet publish Pawpaws-Consulta/Pawpaws.Consulta.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS="http://0.0.0.0:8081"
EXPOSE 8081
ENTRYPOINT ["dotnet", "Pawpaws.Consulta.dll"]
