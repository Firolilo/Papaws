using Cassandra;
using Pawpaws.Animales.Data;
using Pawpaws.Animales.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
builder.Services.AddScoped<IRescatistaService, RescatistaService>();
builder.Services.AddScoped<IAnimalService, AnimalService>();
builder.Services.AddScoped<IDatosPruebaService, DatosPruebaService>();
builder.Services.AddScoped<IHealthService, HealthService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();