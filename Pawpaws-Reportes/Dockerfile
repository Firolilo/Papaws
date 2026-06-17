FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . ./

RUN dotnet restore Pawpaws-Reportes/Pawpaws.Reportes.csproj
RUN dotnet publish Pawpaws-Reportes/Pawpaws.Reportes.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS="http://0.0.0.0:8082"
EXPOSE 8082
ENTRYPOINT ["dotnet", "Pawpaws.Reportes.dll"]
