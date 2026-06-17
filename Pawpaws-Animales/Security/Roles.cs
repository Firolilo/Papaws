namespace Pawpaws.Animales.Security;

public static class Roles
{
    public const string Administrador = "Administrador";
    public const string EncargadoConsultas = "EncargadoConsultas";
    public const string EncargadoRescatistas = "EncargadoRescatistas";

    // Combinaciones usadas en [Authorize(Roles = ...)] (deben ser constantes en tiempo de compilación).
    public const string GestionAnimales = Administrador + "," + EncargadoRescatistas;
    public const string LecturaAnimales = Administrador + "," + EncargadoRescatistas + "," + EncargadoConsultas;
    public const string SoloAdmin = Administrador;
}
