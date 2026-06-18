import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarHeart,
  ChevronRight,
  ClipboardList,
  HeartHandshake,
  PawPrint,
  Scale,
  Stethoscope,
} from "lucide-react";
import { Card, ErrorBox, Spinner } from "../components/Card";
import { Badge, estadoTone } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../auth/AuthContext";
import {
  animalesApi,
  consultasApi,
  rescatistasApi,
  veterinariosApi,
} from "../api/endpoints";
import type { Consulta } from "../types";

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnimalDetalle() {
  const { id = "" } = useParams();
  const { puedeAccederConsultas } = useAuth();

  const animal = useFetch(() => animalesApi.get(id), [id]);
  const rescatistas = useFetch(() => rescatistasApi.list());
  // El historial clínico vive en el servicio de Consulta: solo lo cargamos si el rol
  // tiene acceso (un EncargadoRescatistas ve la ficha pero no las consultas).
  const consultas = useFetch(
    () =>
      puedeAccederConsultas
        ? consultasApi.porAnimal(id)
        : Promise.resolve([] as Consulta[]),
    [id, puedeAccederConsultas]
  );
  const veterinarios = useFetch(
    () => (puedeAccederConsultas ? veterinariosApi.list() : Promise.resolve([])),
    [puedeAccederConsultas]
  );

  const rescatista = useMemo(
    () =>
      animal.data
        ? (rescatistas.data ?? []).find((r) => r.id === animal.data!.rescatistaId)
        : undefined,
    [rescatistas.data, animal.data]
  );

  const vetsById = useMemo(
    () => Object.fromEntries((veterinarios.data ?? []).map((v) => [v.id, v])),
    [veterinarios.data]
  );

  // Historia clínica ordenada de la más reciente a la más antigua.
  const historia = useMemo(
    () =>
      [...(consultas.data ?? [])].sort(
        (a, b) =>
          new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
      ),
    [consultas.data]
  );

  const stats = useMemo(() => {
    const total = historia.length;
    const completadas = historia.filter((c) => c.estado === "Completada").length;
    const ultima = historia.find((c) => c.estado === "Completada") ?? historia[0];
    const proxima = [...historia]
      .reverse()
      .find(
        (c) =>
          (c.estado === "Pendiente" || c.estado === "Confirmada") &&
          new Date(c.fechaHora).getTime() >= Date.now()
      );
    return { total, completadas, ultima, proxima };
  }, [historia]);

  if (animal.loading) return <Spinner />;
  if (animal.error) return <ErrorBox message={animal.error} />;
  if (!animal.data) return <ErrorBox message="Animal no encontrado." />;

  const a = animal.data;

  return (
    <>
      <Link
        to="/animales"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-moss-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Volver a animales
      </Link>

      <PageHeader
        eyebrow="Ficha del paciente"
        title={a.nombre}
        description={`${a.especie} · ingresó el ${formatFecha(a.fechaIngreso)}`}
      />

      {/* Resumen del paciente */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Scale size={18} />}
          label="Peso actual"
          value={`${Number(a.pesoActual).toFixed(2)} kg`}
        />
        <StatCard
          icon={<HeartHandshake size={18} />}
          label="Rescatista"
          value={rescatista?.nombreCompleto ?? "—"}
          hint={rescatista?.organizacion}
        />
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Consultas"
          value={
            puedeAccederConsultas ? String(stats.total) : "—"
          }
          hint={
            puedeAccederConsultas
              ? `${stats.completadas} completada${stats.completadas === 1 ? "" : "s"}`
              : undefined
          }
        />
        <StatCard
          icon={<CalendarHeart size={18} />}
          label="Próxima visita"
          value={
            !puedeAccederConsultas
              ? "—"
              : stats.proxima
              ? formatFecha(stats.proxima.fechaHora)
              : "Sin agendar"
          }
          hint={
            puedeAccederConsultas && stats.proxima
              ? formatHora(stats.proxima.fechaHora)
              : undefined
          }
        />
      </div>

      {/* Historia clínica */}
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope size={18} className="text-moss-700" />
        <h2 className="font-display text-2xl text-moss-800">Historia clínica</h2>
      </div>

      {!puedeAccederConsultas ? (
        <Card className="px-6 py-8">
          <p className="text-sm text-ink-500 leading-relaxed">
            Tu rol no tiene acceso al módulo de consultas, por eso no se muestra
            el historial clínico de este animal. Solicitá acceso a un encargado
            de consultas para verlo.
          </p>
        </Card>
      ) : consultas.loading ? (
        <Spinner />
      ) : consultas.error ? (
        <ErrorBox message={consultas.error} />
      ) : historia.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-clay-50 flex items-center justify-center mb-4">
            <PawPrint size={24} className="text-clay-400" />
          </div>
          <p className="font-display text-xl text-moss-800">
            Sin consultas todavía
          </p>
          <p className="text-sm text-ink-500 mt-1.5">
            Cuando agendes una consulta para {a.nombre}, su evolución aparecerá
            aquí como línea de tiempo.
          </p>
        </Card>
      ) : (
        <ol className="relative border-l-2 border-moss-100 ml-3 space-y-4">
          {historia.map((c) => {
            const vet = vetsById[c.veterinarioId];
            return (
              <li key={c.codigo} className="ml-6">
                {/* Punto en la línea de tiempo */}
                <span className="absolute -left-[9px] mt-1.5 w-4 h-4 rounded-full bg-white border-2 border-moss-400" />
                <Link
                  to={`/consultas/${encodeURIComponent(c.codigo)}`}
                  className="group block"
                >
                  <Card className="p-4 hover:border-moss-400 transition-colors">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge tone={estadoTone(c.estado)}>{c.estado}</Badge>
                      <span className="text-[13px] font-semibold text-moss-800">
                        {formatFecha(c.fechaHora)}
                      </span>
                      <span className="text-[12px] font-mono text-ink-500">
                        {formatHora(c.fechaHora)}
                      </span>
                      <span className="text-[12px] text-ink-500">
                        · Dr/a. {vet?.nombreCompleto ?? "Veterinario"}
                      </span>
                      <span className="ml-auto text-[11px] font-mono text-ink-500/70">
                        {c.codigo}
                      </span>
                      <ChevronRight
                        size={16}
                        className="text-ink-500/40 group-hover:text-moss-700 transition-colors"
                      />
                    </div>

                    {c.diagnostico && (
                      <div className="mt-3 pl-3 border-l-2 border-moss-200">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-moss-700 mb-0.5">
                          Diagnóstico
                        </p>
                        <p className="text-[13.5px] text-ink-700 leading-relaxed">
                          {c.diagnostico}
                        </p>
                        {c.indicacionesSeguimiento && (
                          <p className="text-[12.5px] text-ink-500 mt-1.5 leading-relaxed">
                            <span className="font-semibold">Seguimiento: </span>
                            {c.indicacionesSeguimiento}
                          </p>
                        )}
                      </div>
                    )}

                    {!c.diagnostico && c.observaciones && (
                      <p className="text-[13px] text-ink-500 mt-2 leading-relaxed line-clamp-2">
                        {c.observaciones}
                      </p>
                    )}
                  </Card>
                </Link>
              </li>
            );
          })}
        </ol>
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
      <p className="font-display text-2xl text-moss-800 leading-none truncate">
        {value}
      </p>
      {hint && <p className="text-[12px] text-ink-500 mt-1 truncate">{hint}</p>}
    </Card>
  );
}
