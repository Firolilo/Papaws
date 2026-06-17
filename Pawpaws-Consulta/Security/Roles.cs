namespace Pawpaws.Consulta.Security;

public static class Roles
{
    public const string Administrador = "Administrador";
    public const string EncargadoConsultas = "EncargadoConsultas";
    public const string EncargadoRescatistas = "EncargadoRescatistas";

    // Gestión de consultas y su catálogo (veterinarios, servicios, productos).
    public const string GestionConsultas = Administrador + "," + EncargadoConsultas;
}
