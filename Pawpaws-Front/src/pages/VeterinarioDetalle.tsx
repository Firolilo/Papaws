import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Phone,
  Stethoscope,
} from "lucide-react";
import { Card, ErrorBox, Spinner } from "../components/Card";
import { Badge, estadoTone } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { consultasApi, veterinariosApi } from "../api/endpoints";

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VeterinarioDetalle() {
  const { id = "" } = useParams();
  const veterinario = useFetch(() => veterinariosApi.get(id), [id]);
  const consultas = useFetch(() => consultasApi.porVeterinario(id), [id]);

  // Consultas ordenadas de la más reciente a la más antigua.
  const lista = useMemo(
    () =>
      [...(consultas.data ?? [])].sort(
        (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
      ),
    [consultas.data]
  );

  const stats = useMemo(() => {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    return {
      total: lista.length,
      esteMes: lista.filter((c) => new Date(c.fechaHora) >= inicioMes).length,
      completadas: lista.filter((c) => c.estado === "Completada").length,
      pendientes: lista.filter(
        (c) => c.estado === "Pendiente" || c.estado === "Confirmada"
      ).length,
    };
  }, [lista]);

  if (veterinario.loading) return <Spinner />;
  if (veterinario.error) return <ErrorBox message={veterinario.error} />;
  if (!veterinario.data)
    return <ErrorBox message="Veterinario no encontrado." />;

  const v = veterinario.data;

  return (
    <>
      <Link
        to="/veterinarios"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-moss-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Volver a veterinarios
      </Link>

      <PageHeader
        eyebrow="Equipo clínico"
        title={v.nombreCompleto}
        description={`Especialidad principal · ${v.especialidadPrincipal}`}
        actions={<Badge tone="clay">{v.especialidadPrincipal}</Badge>}
      />

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<ClipboardList size={18} />} label="Consultas totales" value={String(stats.total)} />
        <StatCard icon={<CalendarCheck size={18} />} label="Este mes" value={String(stats.esteMes)} />
        <StatCard icon={<Stethoscope size={18} />} label="Completadas" value={String(stats.completadas)} />
        <StatCard icon={<ClipboardList size={18} />} label="Por atender" value={String(stats.pendientes)} />
      </div>

      <Card className="p-4 mb-6 flex items-center gap-2 text-sm text-ink-600">
        <Phone size={15} className="text-moss-600" />
        <span className="font-mono text-[13px]">{v.telefonoContacto}</span>
      </Card>

      {/* Consultas atendidas */}
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList size={18} className="text-moss-700" />
        <h2 className="font-display text-2xl text-moss-800">Consultas</h2>
      </div>

      {consultas.loading ? (
        <Spinner />
      ) : consultas.error ? (
        <ErrorBox message={consultas.error} />
      ) : lista.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-clay-50 flex items-center justify-center mb-4">
            <ClipboardList size={24} className="text-clay-400" />
          </div>
          <p className="font-display text-xl text-moss-800">Sin consultas</p>
          <p className="text-sm text-ink-500 mt-1.5">
            Este veterinario todavía no tiene consultas registradas.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bone-100/60 text-ink-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Código</th>
                  <th className="text-left font-semibold px-5 py-3">Fecha y hora</th>
                  <th className="text-left font-semibold px-5 py-3">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-moss-100">
                {lista.map((c) => (
                  <tr key={c.codigo} className="hover:bg-bone-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/consultas/${encodeURIComponent(c.codigo)}`}
                        className="group inline-flex items-center gap-2 font-medium text-moss-800 hover:text-moss-600"
                      >
                        {c.codigo}
                        <ChevronRight size={14} className="text-ink-500/30 group-hover:text-moss-600" />
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink-500 text-[12.5px]">
                      {formatFechaHora(c.fechaHora)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={estadoTone(c.estado)}>{c.estado}</Badge>
                    </td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-moss-600 mb-2">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
          {label}
        </span>
      </div>
      <p className="font-display text-xl text-moss-800 leading-tight truncate">{value}</p>
    </Card>
  );
}
