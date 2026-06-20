namespace Pawpaws.Animales.Models;

/// <summary>
/// Resultado de reasignar los animales de un rescatista al darlo de baja:
/// cuántos quedaron en el rescatista destino y cuántos se derivaron al Refugio
/// por superar el cupo máximo.
/// </summary>
public record ReasignacionResultado(int AlDestino, int AlRefugio);
