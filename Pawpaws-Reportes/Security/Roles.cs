namespace Pawpaws.Reportes.Security;

public static class Roles
{
    public const string Administrador = "Administrador";
    public const string EncargadoConsultas = "EncargadoConsultas";
    public const string EncargadoRescatistas = "EncargadoRescatistas";
    public const string LecturaGlobal = Administrador + "," + EncargadoConsultas + "," + EncargadoRescatistas;
}
