using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Pawpaws.Animales.Common;

public static class SwaggerJwt
{
    public static void Configurar(SwaggerGenOptions options)
    {
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Pegá el token JWT (sin el prefijo 'Bearer ')."
        });

        options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
        {
            { new OpenApiSecuritySchemeReference("Bearer", document, null), new List<string>() }
        });
    }
}
