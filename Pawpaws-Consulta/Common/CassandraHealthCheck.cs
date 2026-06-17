using Cassandra;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Pawpaws.Consulta.Common;

public class CassandraHealthCheck : IHealthCheck
{
    private readonly Cassandra.ISession _session;

    public CassandraHealthCheck(Cassandra.ISession session)
    {
        _session = session;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            await _session.ExecuteAsync(new SimpleStatement("SELECT release_version FROM system.local"));
            return HealthCheckResult.Healthy("Cassandra responde.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Cassandra no responde.", ex);
        }
    }
}
