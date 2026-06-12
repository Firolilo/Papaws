using Cassandra;
using Pawpaws.Consulta.Data;
using Pawpaws.Consulta.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var cassandraContactPoints = builder.Configuration["Cassandra:ContactPoints"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ??
    new[] { builder.Configuration["Cassandra:ContactPoint"] ?? "localhost" };
var cassandraPort = int.TryParse(builder.Configuration["Cassandra:Port"], out var parsedPort) ? parsedPort : 9042;
var keyspace = builder.Configuration["Cassandra:Keyspace"] ?? "papaws_consulta";

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
builder.Services.AddHttpClient<IAnimalReferenceService, AnimalReferenceService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:AnimalesBaseUrl"] ?? "http://animales:8080");
});

builder.Services.AddScoped<IVeterinarioService, VeterinarioService>();
builder.Services.AddScoped<IServicioService, ServicioService>();
builder.Services.AddScoped<IConsultaService, ConsultaService>();
builder.Services.AddScoped<IProductoService, ProductoService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();