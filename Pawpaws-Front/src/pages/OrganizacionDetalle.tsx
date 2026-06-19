import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  HeartHandshake,
  PawPrint,
} from "lucide-react";
import { Card, ErrorBox, Spinner } from "../components/Card";
import { Badge } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { animalesApi, organizacionesApi, rescatistasApi } from "../api/endpoints";

export function OrganizacionDetalle() {
  const { id = "" } = useParams();
  const organizacion = useFetch(() => organizacionesApi.get(id), [id]);
  const rescatistas = useFetch(() => rescatistasApi.list());
  const animales = useFetch(() => animalesApi.list());

  // Conteo de animales por rescatista.
  const animalesPorRescatista = useMemo(() => {
    const map = new Map<string, number>();
    (animales.data ?? []).forEach((a) =>
      map.set(a.rescatistaId, (map.get(a.rescatistaId) ?? 0) + 1)
    );
    return map;
  }, [animales.data]);

  const miembros = useMemo(
    () =>
      (rescatistas.data ?? [])
        .filter((r) => !r.oculto && r.organizacionId === id)
        .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)),
    [rescatistas.data, id]
  );

  // "Miembro desde": fecha del evento más reciente en que cada rescatista entró a ESTA
  // organización (alta o cambio). Se deriva del historial de organización del rescatista.
  const nombreOrg = organizacion.data?.nombre;
  const [miembroDesde, setMiembroDesde] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!nombreOrg || miembros.length === 0) return;
    let cancelado = false;
    Promise.all(
      miembros.map(async (r) => {
        try {
          const eventos = await rescatistasApi.historialOrganizaciones(r.id);
          const entrada = eventos
            .filter((e) => e.organizacionNueva === nombreOrg)
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
          return [r.id, entrada?.fecha ?? ""] as const;
        } catch {
          return [r.id, ""] as const;
        }
      })
    ).then((pares) => {
      if (cancelado) return;
      setMiembroDesde(Object.fromEntries(pares));
    });
    return () => {
      cancelado = true;
    };
  }, [nombreOrg, miembros]);

  if (organizacion.loading) return <Spinner />;
  if (organizacion.error) return <ErrorBox message={organizacion.error} />;
  if (!organizacion.data) return <ErrorBox message="Organización no encontrada." />;

  const o = organizacion.data;
  const totalAnimales = miembros.reduce(
    (acc, r) => acc + (animalesPorRescatista.get(r.id) ?? 0),
    0
  );

  return (
    <>
      <Link
        to="/organizaciones"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-moss-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Volver a organizaciones
      </Link>

      <PageHeader
        eyebrow="Red de rescate"
        title={o.nombre}
        actions={<Badge tone="blue">{o.tipo}</Badge>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={<Building2 size={18} />} label="Tipo" value={o.tipo} />
        <StatCard
          icon={<HeartHandshake size={18} />}
          label="Rescatistas"
          value={String(miembros.length)}
        />
        <StatCard
          icon={<PawPrint size={18} />}
          label="Animales ingresados"
          value={String(totalAnimales)}
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <HeartHandshake size={18} className="text-moss-700" />
        <h2 className="font-display text-2xl text-moss-800">Rescatistas</h2>
      </div>

      {rescatistas.loading ? (
        <Spinner />
      ) : miembros.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-clay-50 flex items-center justify-center mb-4">
            <HeartHandshake size={24} className="text-clay-400" />
          </div>
          <p className="font-display text-xl text-moss-800">Sin rescatistas</p>
          <p className="text-sm text-ink-500 mt-1.5">
            Esta organización todavía no tiene rescatistas asignados. Asignás la
            organización al crear o editar un rescatista.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bone-100/60 text-ink-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Rescatista</th>
                  <th className="text-left font-semibold px-5 py-3">Zona</th>
                  <th className="text-left font-semibold px-5 py-3">Miembro desde</th>
                  <th className="text-right font-semibold px-5 py-3">Animales</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-moss-100">
                {miembros.map((r) => (
                  <tr key={r.id} className="hover:bg-bone-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/rescatistas/${r.id}`}
                        className="group inline-flex items-center gap-2 font-medium text-moss-800 hover:text-moss-600"
                      >
                        {r.nombreCompleto}
                        <ChevronRight size={14} className="text-ink-500/30 group-hover:text-moss-600" />
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink-500">{r.zonaOperacion}</td>
                    <td className="px-5 py-3.5 text-ink-500 text-[12.5px]">
                      {miembroDesde[r.id]
                        ? new Date(miembroDesde[r.id]).toLocaleDateString("es", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      {animalesPorRescatista.get(r.id) ?? 0}
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
