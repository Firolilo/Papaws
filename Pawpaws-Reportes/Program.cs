using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Pawpaws.Reportes.Common;
using Pawpaws.Reportes.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(SwaggerJwt.Configurar);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// --- Validación de JWT (misma clave que emite el servicio de Animales) ---
var jwtKey = builder.Configuration["Auth:Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Auth:Jwt:Key no está configurada o es demasiado corta (mínimo 32 caracteres). Definí PAPAWS_JWT_KEY en el entorno (ver .env.example).");
var jwtIssuer = builder.Configuration["Auth:Jwt:Issuer"] ?? "papaws";
var jwtAudience = builder.Configuration["Auth:Jwt:Audience"] ?? "papaws";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();

// Necesario para reenviar el token del usuario en las llamadas a otros servicios.
builder.Services.AddHttpContextAccessor();

builder.Services.AddCors(options =>
{
    options.AddPolicy("PapawsFront", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:4173",
                "http://127.0.0.1:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddHttpClient<IAnimalesClient, AnimalesClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:AnimalesBaseUrl"] ?? "http://papaws-animales:8080");
    client.Timeout = TimeSpan.FromSeconds(5);
});

builder.Services.AddHttpClient<IConsultaClient, ConsultaClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:ConsultaBaseUrl"] ?? "http://papaws-consulta:8081");
    client.Timeout = TimeSpan.FromSeconds(5);
});

builder.Services.AddScoped<IReporteService, ReporteService>();

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("PapawsFront");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
