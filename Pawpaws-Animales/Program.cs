using System.Text;
using Cassandra;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Pawpaws.Animales.Common;
using Pawpaws.Animales.Data;
using Pawpaws.Animales.Security;
using Pawpaws.Animales.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(SwaggerJwt.Configurar);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// --- Autenticación / Autorización (JWT) ---
builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection("Auth"));
builder.Services.AddScoped<IJwtService, JwtService>();

var jwtKey = builder.Configuration["Auth:Jwt:Key"] ?? throw new InvalidOperationException("Falta Auth:Jwt:Key.");
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

var cassandraContactPoints = builder.Configuration["Cassandra:ContactPoints"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ??
    new[] { builder.Configuration["Cassandra:ContactPoint"] ?? "localhost" };
var cassandraPort = int.TryParse(builder.Configuration["Cassandra:Port"], out var parsedPort) ? parsedPort : 9042;
var keyspace = builder.Configuration["Cassandra:Keyspace"] ?? "papaws_animales";

var clusterBuilder = Cluster.Builder().WithPort(cassandraPort);
foreach (var contactPoint in cassandraContactPoints)
{
    clusterBuilder = clusterBuilder.AddContactPoint(contactPoint);
}

var cluster = clusterBuilder.Build();

var session = await cluster.ConnectAsync();
await CassandraSchema.InitializeAsync(session, keyspace);
session = await cluster.ConnectAsync(keyspace);

builder.Services.AddSingleton(session);

// Necesario para reenviar el token del usuario en las llamadas al servicio de Consulta.
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient<IConsultaReferenceService, ConsultaReferenceService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:ConsultaBaseUrl"] ?? "http://localhost:8081");
    // Evita que una caída del servicio de Consulta deje peticiones colgadas indefinidamente.
    client.Timeout = TimeSpan.FromSeconds(10);
});

builder.Services.AddScoped<IRescatistaService, RescatistaService>();
builder.Services.AddScoped<IAnimalService, AnimalService>();
builder.Services.AddScoped<IDatosPruebaService, DatosPruebaService>();
builder.Services.AddScoped<IHealthService, HealthService>();

builder.Services.AddHealthChecks().AddCheck<CassandraHealthCheck>("cassandra");

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
app.MapHealthChecks("/health");
app.Run();