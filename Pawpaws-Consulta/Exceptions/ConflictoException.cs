namespace Pawpaws.Consulta.Exceptions;

/// <summary>
/// Indica un conflicto con el estado actual del recurso (se traduce a HTTP 409).
/// </summary>
public class ConflictoException : Exception
{
    public ConflictoException(string mensaje) : base(mensaje)
    {
    }
}
