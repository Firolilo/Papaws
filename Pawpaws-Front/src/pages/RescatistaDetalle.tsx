import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Mail,
  MapPin,
  PawPrint,
  Phone,
} from "lucide-react";
import { Card, ErrorBox, Spinner } from "../components/Card";
import { Badge, estadoTone, Tone } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { animalesApi, rescatistasApi } from "../api/endpoints";

const ESTADO_TONE: Record<string, Tone> = {
  Disponible: "blue",
  EnTratamiento: "sun",
  Adoptado: "moss",
  Devuelto: "clay",
};
const ESTADO_LABEL: Record<string, string> = {
  Disponible: "Disponible",
  EnTratamiento: "En tratamiento",
  Adoptado: "Adoptado",
  Devuelto: "Devuelto",
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RescatistaDetalle() {
  const { id = "" } = useParams();
  const rescatista = useFetch(() => rescatistasApi.get(id), [id]);
  const animales = useFetch(() => animalesApi.porRescatista(id), [id]);
  const historialOrg = useFetch(() => rescatistasApi.historialOrganizaciones(id), [id]);

  const cambiosOrg = useMemo(
    () =>
      [...(historialOrg.data ?? [])].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    [historialOrg.data]
  );

  // Animales ordenados por fecha de ingreso (más reciente primero).
  const lista = useMemo(
    () =>
      [...(animales.data ?? [])].sort(
        (a, b) =>
          new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()
      ),
    [animales.data]
  );

  if (rescatista.loading) return <Spinner />;
  if (rescatista.error) return <ErrorBox message={rescatista.error} />;
  if (!rescatista.data) return <ErrorBox message="Rescatista no encontrado." />;

  const r = rescatista.data;
  const total = lista.length;
  const adoptados = lista.filter((a) => a.estado === "Adoptado").length;

  return (
    <>
      <Link
        to="/rescatistas"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-moss-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Volver a rescatistas
      </Link>

      <PageHeader
        eyebrow="Red de rescate"
        title={r.nombreCompleto}
        description={`${r.organizacion || "Sin organización"} · zona ${r.zonaOperacion}`}
        actions={!r.activo ? <Badge tone="clay">Dado de baja</Badge> : undefined}
      />

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Building2 size={18} />} label="Organización" value={r.organizacion || "—"} />
        <StatCard icon={<MapPin size={18} />} label="Zona" value={r.zonaOperacion} />
        <StatCard icon={<Phone size={18} />} label="Teléfono" value={r.telefonoContacto} />
        <StatCard
          icon={<PawPrint size={18} />}
          label="Animales ingresados"
          value={String(total)}
          hint={adoptados > 0 ? `${adoptados} adoptado${adoptados === 1 ? "" : "s"}` : undefined}
        />
      </div>

      <Card className="p-4 mb-6 flex items-center gap-2 text-sm text-ink-600">
        <Mail size={15} className="text-moss-600" />
        {r.correoElectronico}
      </Card>

      {/* Historial de organización */}
      {cambiosOrg.length > 0 && (
        <Card className="p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-moss-700" />
            <h2 className="font-display text-lg text-moss-800">
              Historial de organización
            </h2>
          </div>
          <ol className="space-y-2.5">
            {cambiosOrg.map((ev, i) => (
              <li key={i} className="flex items-start gap-3">
                <Badge tone={ev.tipo === "Cambio" ? "sun" : "moss"}>
                  {ev.tipo === "Cambio" ? "Cambio" : "Alta"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-ink-700">
                    {formatFecha(ev.fecha)} ·{" "}
                    {ev.tipo === "Cambio" && ev.organizacionAnterior ? (
                      <>
                        de <strong>{ev.organizacionAnterior}</strong> a{" "}
                        <strong>{ev.organizacionNueva}</strong>
                      </>
                    ) : (
                      <>
                        ingresó a <strong>{ev.organizacionNueva}</strong>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Animales ingresados */}
      <div className="flex items-center gap-2 mb-4">
        <PawPrint size={18} className="text-moss-700" />
        <h2 className="font-display text-2xl text-moss-800">Animales ingresados</h2>
      </div>

      {animales.loading ? (
        <Spinner />
      ) : animales.error ? (
        <ErrorBox message={animales.error} />
      ) : lista.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-clay-50 flex items-center justify-center mb-4">
            <PawPrint size={24} className="text-clay-400" />
          </div>
          <p className="font-display text-xl text-moss-800">Sin animales</p>
          <p className="text-sm text-ink-500 mt-1.5">
            Este rescatista todavía no ingresó animales al centro.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bone-100/60 text-ink-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Animal</th>
                  <th className="text-left font-semibold px-5 py-3">Especie</th>
                  <th className="text-left font-semibold px-5 py-3">Ingresó</th>
                  <th className="text-left font-semibold px-5 py-3">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-moss-100">
                {lista.map((a) => (
                  <tr key={a.id} className="hover:bg-bone-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/animales/${a.id}`}
                        className="group inline-flex items-center gap-2 font-medium text-moss-800 hover:text-moss-600"
                      >
                        {a.nombre}
                        <ChevronRight size={14} className="text-ink-500/30 group-hover:text-moss-600" />
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink-500">{a.especie}</td>
                    <td className="px-5 py-3.5 text-ink-500 text-[12.5px]">
                      {formatFecha(a.fechaIngreso)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={ESTADO_TONE[a.estado] ?? estadoTone(a.estado)}>
                        {ESTADO_LABEL[a.estado] ?? a.estado}
                      </Badge>
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
