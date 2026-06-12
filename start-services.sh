#!/usr/bin/env bash
set -euo pipefail

# Start both services and keep container running while either runs.
# Animales -> HTTP port 8080
# Consulta  -> HTTP port 8081

echo "Starting Pawpaws.Animales on :8080"
ASPNETCORE_URLS="http://0.0.0.0:8080" dotnet ./animales/Pawpaws.Animales.dll &
ANIMALES_PID=$!

echo "Starting Pawpaws.Consulta on :8081"
ASPNETCORE_URLS="http://0.0.0.0:8081" dotnet ./consulta/Pawpaws.Consulta.dll &
CONSULTA_PID=$!

wait -n $ANIMALES_PID $CONSULTA_PID
EXIT_CODE=$?
echo "One service exited with code $EXIT_CODE, shutting down the other."
kill $ANIMALES_PID $CONSULTA_PID 2>/dev/null || true
exit $EXIT_CODE
