namespace Pawpaws.Consulta.Security;

public static class Roles
{
    public const string Administrador = "Administrador";
    public const string EncargadoConsultas = "EncargadoConsultas";
    public const string EncargadoRescatistas = "EncargadoRescatistas";

    // Gestión de consultas y su catálogo (veterinarios, servicios, productos).
    public const string GestionConsultas = Administrador + "," + EncargadoConsultas;

    // Borrado en cascada disparado al eliminar un animal: lo invoca el servicio de Animales
    // reenviando el token del usuario, que puede ser EncargadoRescatistas (gestiona animales
    // pero no consultas). Por eso este endpoint interno admite también ese rol.
    public const string CascadaAnimales = Administrador + "," + EncargadoConsultas + "," + EncargadoRescatistas;
}
