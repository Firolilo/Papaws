using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Pawpaws.Animales.Common;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        var (status, titulo) = exception switch
        {
            InvalidOperationException => (StatusCodes.Status400BadRequest, exception.Message),
            _ => (StatusCodes.Status500InternalServerError, "Ocurrió un error inesperado.")
        };

        if (status == StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception, "Error no controlado al procesar {Path}", context.Request.Path);
        }

        var problema = new ProblemDetails
        {
            Status = status,
            Title = titulo,
            Type = $"https://httpstatuses.io/{status}"
        };

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(problema, cancellationToken);
        return true;
    }
}
