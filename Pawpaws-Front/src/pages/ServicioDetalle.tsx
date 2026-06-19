import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Coins,
  Stethoscope,
} from "lucide-react";
import { Card, ErrorBox, Spinner } from "../components/Card";
import { Badge, estadoTone } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { consultasApi, serviciosApi } from "../api/endpoints";

const fmt = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ServicioDetalle() {
  const { id = "" } = useParams();
  const servicio = useFetch(() => serviciosApi.get(id), [id]);
  const consultas = useFetch(() => consultasApi.porServicio(id), [id]);

  // Consultas que usaron este servicio, de la más reciente a la más antigua.
  const lista = useMemo(
    () =>
      [...(consultas.data ?? [])].sort(
        (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
      ),
    [consultas.data]
  );

  const stats = useMemo(() => {
    // Solo las consultas no canceladas cuentan como ingreso facturable estimado.
    const facturables = lista.filter((c) => c.estado !== "Cancelada");
    return {
      total: lista.length,
      facturables: facturables.length,
      ingresos: facturables.length * (servicio.data?.precioBase ?? 0),
    };
  }, [lista, servicio.data]);

  if (servicio.loading) return <Spinner />;
  if (servicio.error) return <ErrorBox message={servicio.error} />;
  if (!servicio.data) return <ErrorBox message="Servicio no encontrado." />;

  const s = servicio.data;

  return (
    <>
      <Link
        to="/servicios"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-moss-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Volver a servicios
      </Link>

      <PageHeader
        eyebrow="Catálogo"
        title={s.nombre}
        description={s.descripcion}
        actions={
          <span className="font-mono text-sm text-clay-600 font-semibold whitespace-nowrap">
            {fmt.format(s.precioBase)}
          </span>
        }
      />

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Clock size={18} />} label="Duración estimada" value={`${s.duracionEstimadaMinutos} min`} />
        <StatCard icon={<Coins size={18} />} label="Precio base" value={fmt.format(s.precioBase)} />
        <StatCard icon={<ClipboardList size={18} />} label="Veces usado" value={String(stats.total)} />
        <StatCard
          icon={<Coins size={18} />}
          label="Ingreso estimado"
          value={fmt.format(stats.ingresos)}
          hint={`${stats.facturables} consulta${stats.facturables === 1 ? "" : "s"} no cancelada${stats.facturables === 1 ? "" : "s"}`}
        />
      </div>

      {/* Consultas que lo usaron */}
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope size={18} className="text-moss-700" />
        <h2 className="font-display text-2xl text-moss-800">
          Consultas que usaron este servicio
        </h2>
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
          <p className="font-display text-xl text-moss-800">Sin uso registrado</p>
          <p className="text-sm text-ink-500 mt-1.5">
            Este servicio todavía no se incluyó en ninguna consulta.
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
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
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
      {hint && <p className="text-[12px] text-ink-500 mt-1 truncate">{hint}</p>}
    </Card>
  );
}
