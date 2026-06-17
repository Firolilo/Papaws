import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarHeart,
  HeartHandshake,
  PawPrint,
  Pill,
  Sparkles,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { Card, ErrorBox, Spinner } from "../components/Card";
import { Badge, CollarTag, estadoTone } from "../components/Badge";
import { Mascot } from "../components/Mascot";
import { PawIcon } from "../components/Logo";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../auth/AuthContext";
import {
  animalesApi,
  consultasApi,
  productosApi,
  rescatistasApi,
  serviciosApi,
  veterinariosApi,
} from "../api/endpoints";

export function Dashboard() {
  const { puedeAccederConsultas } = useAuth();
  const rescatistas = useFetch(() => rescatistasApi.list());
  const animales = useFetch(() => animalesApi.list());
  // El módulo de consultas solo es accesible para Admin / Encargado de consultas.
  const veterinarios = useFetch(
    () => (puedeAccederConsultas ? veterinariosApi.list() : Promise.resolve([])),
    [puedeAccederConsultas]
  );
  const servicios = useFetch(
    () => (puedeAccederConsultas ? serviciosApi.list() : Promise.resolve([])),
    [puedeAccederConsultas]
  );
  const productos = useFetch(
    () => (puedeAccederConsultas ? productosApi.list() : Promise.resolve([])),
    [puedeAccederConsultas]
  );
  const consultas = useFetch(
    () => (puedeAccederConsultas ? consultasApi.list() : Promise.resolve([])),
    [puedeAccederConsultas]
  );

  const loading =
    rescatistas.loading ||
    animales.loading ||
    veterinarios.loading ||
    servicios.loading ||
    productos.loading ||
    consultas.loading;

  const error =
    rescatistas.error ||
    animales.error ||
    veterinarios.error ||
    servicios.error ||
    productos.error ||
    consultas.error;

  // Consultas vigentes: se ocultan las huérfanas (su animal ya no existe).
  const consultasVigentes = useMemo(() => {
    const cs = consultas.data ?? [];
    if (!animales.data) return cs;
    const ids = new Set(animales.data.map((a) => a.id));
    return cs.filter((c) => ids.has(c.animalId));
  }, [consultas.data, animales.data]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    consultasVigentes.forEach((c) => (counts[c.estado] = (counts[c.estado] ?? 0) + 1));
    return {
      pendientes: counts["Pendiente"] ?? 0,
      confirmadas: counts["Confirmada"] ?? 0,
      completadas: counts["Completada"] ?? 0,
    };
  }, [consultasVigentes]);

  const proximas = useMemo(() => {
    return [...consultasVigentes]
      // En el home solo se muestran las próximas (pendientes/confirmadas);
      // canceladas y completadas se ven en la pestaña de Consultas.
      .filter((c) => c.estado === "Pendiente" || c.estado === "Confirmada")
      .sort(
        (a, b) =>
          new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
      )
      .slice(0, 5);
  }, [consultasVigentes]);

  const stockBajo = useMemo(
    () =>
      (productos.data ?? [])
        .filter((p) => p.stockDisponible <= 10)
        .sort((a, b) => a.stockDisponible - b.stockDisponible)
        .slice(0, 5),
    [productos.data]
  );

  const recienLlegados = useMemo(
    () =>
      [...(animales.data ?? [])]
        .sort(
          (a, b) =>
            new Date(b.fechaIngreso).getTime() -
            new Date(a.fechaIngreso).getTime()
        )
        .slice(0, 3),
    [animales.data]
  );

  const animalesById = useMemo(
    () => Object.fromEntries((animales.data ?? []).map((a) => [a.id, a])),
    [animales.data]
  );
  const vetsById = useMemo(
    () =>
      Object.fromEntries((veterinarios.data ?? []).map((v) => [v.id, v])),
    [veterinarios.data]
  );

  const today = new Date().toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-moss-700 via-moss-700 to-moss-800 text-white p-8 sm:p-10 mb-10 paw-confetti">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-hand text-3xl text-clay-300 leading-none">
              ¡Hola de nuevo!
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.1] mt-2 text-white">
              Hoy hay{" "}
              <span className="text-clay-200">
                {animales.data?.length ?? "…"}
              </span>{" "}
              corazones bajo tu cuidado.
            </h1>
            <p className="mt-4 text-clay-50 text-[15px] font-medium leading-relaxed">
              {today}. Una cita a tiempo puede cambiar una vida. Echemos un
              vistazo a quién necesita atención hoy.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Link
                to="/consultas"
                className="inline-flex items-center gap-2 bg-white text-moss-800 font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-clay-50 transition-colors"
              >
                Ver agenda <ArrowRight size={15} />
              </Link>
              <Link
                to="/animales"
                className="inline-flex items-center gap-2 bg-white/10 text-white ring-1 ring-white/30 font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-white/20 transition-colors"
              >
                <PawIcon size={15} /> Mis rescatados
              </Link>
            </div>
          </div>
          <div className="self-end sm:self-center -mb-8 sm:mb-0">
            <Mascot size={180} />
          </div>
        </div>
      </section>

      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}

      {!loading && !error && (
        <>
          {/* MÉTRICAS - estilo plaquita */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Metric
              label="En cuidado"
              value={animales.data?.length ?? 0}
              icon={<PawPrint size={18} />}
              tone="moss"
              href="/animales"
            />
            <Metric
              label="Rescatistas"
              value={(rescatistas.data ?? []).filter((r) => !r.oculto).length}
              icon={<HeartHandshake size={18} />}
              tone="clay"
              href="/rescatistas"
            />
            {puedeAccederConsultas && (
              <>
                <Metric
                  label="Veterinarios"
                  value={veterinarios.data?.length ?? 0}
                  icon={<Stethoscope size={18} />}
                  tone="sun"
                  href="/veterinarios"
                />
                <Metric
                  label="Consultas"
                  value={consultasVigentes.length}
                  icon={<CalendarHeart size={18} />}
                  tone="moss"
                  href="/consultas"
                />
              </>
            )}
          </div>

          {/* ESTADO DE CONSULTAS */}
          {puedeAccederConsultas && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
              <StateCard
                tone="sun"
                label="Pendientes"
                value={stats.pendientes}
                note="esperan confirmación"
              />
              <StateCard
                tone="blue"
                label="Confirmadas"
                value={stats.confirmadas}
                note="todo listo"
              />
              <StateCard
                tone="moss"
                label="Atendidas"
                value={stats.completadas}
                note="¡con cariño!"
              />
            </div>
          )}

          {/* RECIÉN RESCATADOS */}
          {recienLlegados.length > 0 && (
            <section className="mb-10">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="font-hand text-2xl text-clay-500 leading-none">
                    los nuevos peluditos
                  </p>
                  <h2 className="font-display text-3xl text-moss-800 mt-1">
                    Recién rescatados
                  </h2>
                </div>
                <Link
                  to="/animales"
                  className="text-sm text-moss-700 font-semibold hover:underline flex items-center gap-1"
                >
                  Ver todos <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recienLlegados.map((a, i) => (
                  <RescuedCard key={a.id} animal={a} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* AGENDA + STOCK */}
          {puedeAccederConsultas && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-10">
            <Card className="lg:col-span-3 p-6">
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <p className="font-hand text-xl text-clay-500 leading-none">
                    lo que viene
                  </p>
                  <h2 className="font-display text-2xl text-moss-800">
                    Próximas consultas
                  </h2>
                </div>
                <Link
                  to="/consultas"
                  className="text-sm text-moss-700 font-semibold hover:underline flex items-center gap-1"
                >
                  Agenda <ArrowRight size={14} />
                </Link>
              </div>

              {proximas.length === 0 ? (
                <div className="text-center py-10">
                  <p className="font-hand text-2xl text-clay-500">
                    sin citas por ahora ♡
                  </p>
                  <p className="text-sm text-ink-500 mt-1">
                    Cuando agendes consultas aparecerán aquí.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-moss-100">
                  {proximas.map((c) => {
                    const animal = animalesById[c.animalId];
                    const vet = vetsById[c.veterinarioId];
                    return (
                      <li key={c.codigo}>
                        <Link
                          to={`/consultas/${encodeURIComponent(c.codigo)}`}
                          className="flex items-center justify-between py-3.5 group"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <DateBlock iso={c.fechaHora} />
                            <div className="min-w-0">
                              <p className="font-semibold text-moss-800 truncate">
                                {animal?.nombre ?? "Animal"}
                                <span className="font-normal text-ink-400">
                                  {" "}
                                  · {animal?.especie ?? "—"}
                                </span>
                              </p>
                              <p className="text-xs text-ink-500 truncate mt-0.5">
                                Dr/a. {vet?.nombreCompleto ?? "—"} ·{" "}
                                <span className="font-mono">{c.codigo}</span>
                              </p>
                            </div>
                          </div>
                          <Badge tone={estadoTone(c.estado)}>{c.estado}</Badge>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="lg:col-span-2 p-6">
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <p className="font-hand text-xl text-clay-500 leading-none">
                    despensa
                  </p>
                  <h2 className="font-display text-2xl text-moss-800">
                    Stock bajo
                  </h2>
                </div>
                <Link
                  to="/productos"
                  className="text-sm text-moss-700 font-semibold hover:underline flex items-center gap-1"
                >
                  Inventario <ArrowRight size={14} />
                </Link>
              </div>

              {stockBajo.length === 0 ? (
                <div className="text-center py-10">
                  <Sparkles
                    size={22}
                    className="mx-auto text-clay-400 mb-2"
                  />
                  <p className="font-hand text-xl text-clay-500">
                    despensa llena ♡
                  </p>
                </div>
              ) : (
                <ul className="space-y-3.5">
                  {stockBajo.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-moss-800 truncate">
                          {p.nombre}
                        </p>
                        <p className="text-xs text-ink-500">{p.tipo}</p>
                      </div>
                      <CollarTag
                        tone={p.stockDisponible === 0 ? "red" : "amber"}
                      >
                        {p.stockDisponible} {p.unidadMedida}
                      </CollarTag>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
          )}

          {/* Quote */}
          <div className="relative bg-clay-50 rounded-[2rem] p-8 sm:p-10 mb-10 overflow-hidden paw-bg">
            <div className="relative max-w-2xl">
              <p className="font-hand text-3xl text-clay-500 leading-none mb-2">
                desde el equipo Papaws
              </p>
              <p className="font-display italic text-2xl sm:text-3xl text-moss-800 leading-tight">
                “Hasta que uno no haya amado a un animal, una parte de su alma
                permanece dormida.”
              </p>
              <p className="mt-3 text-ink-500 text-sm">— Anatole France</p>
            </div>
          </div>

          {/* Accesos rápidos */}
          {puedeAccederConsultas && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickAction
              to="/servicios"
              icon={<Syringe size={18} />}
              title="Servicios"
              subtitle={`${servicios.data?.length ?? 0} procedimientos disponibles`}
            />
            <QuickAction
              to="/productos"
              icon={<Pill size={18} />}
              title="Productos"
              subtitle={`${productos.data?.length ?? 0} ítems en la despensa`}
            />
          </div>
          )}
        </>
      )}
    </>
  );
}

function Metric({
  label,
  value,
  icon,
  href,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  tone: "moss" | "clay" | "sun";
}) {
  const tones = {
    moss: "bg-moss-50 text-moss-700",
    clay: "bg-clay-50 text-clay-500",
    sun: "bg-sun-300 text-sun-500",
  }[tone];
  return (
    <Link
      to={href}
      className="relative p-5 rounded-xl2 bg-white border border-moss-100 shadow-soft hover:-translate-y-0.5 hover:shadow-card transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center ${tones}`}>
          {icon}
        </span>
        <ArrowRight
          size={14}
          className="text-ink-400 group-hover:text-moss-700 group-hover:translate-x-0.5 transition-all"
        />
      </div>
      <p className="font-display text-4xl text-moss-800 leading-none">
        {value}
      </p>
      <p className="text-xs text-ink-500 mt-2 font-semibold uppercase tracking-wider">
        {label}
      </p>
    </Link>
  );
}

function StateCard({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: number;
  tone: "sun" | "blue" | "moss";
  note: string;
}) {
  const palette = {
    sun: "bg-sun-300 text-ink-700 ring-sun-400/30",
    blue: "bg-moss-50 text-moss-800 ring-moss-200/50",
    moss: "bg-moss-700 text-white ring-moss-800/30",
  }[tone];
  const handColor = tone === "moss" ? "text-clay-100" : "text-clay-500";
  return (
    <div className={`rounded-xl2 ring-1 p-5 ${palette}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] font-bold opacity-80">
        {label}
      </p>
      <p className="font-display text-5xl mt-2 leading-none">{value}</p>
      <p className={`font-hand text-lg mt-2 leading-none ${handColor}`}>
        {note}
      </p>
    </div>
  );
}

function DateBlock({ iso }: { iso: string }) {
  const d = new Date(iso);
  const month = d.toLocaleDateString("es", { month: "short" }).toUpperCase();
  return (
    <div className="w-14 text-center shrink-0 rounded-2xl bg-bone-100 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-clay-500 font-bold">
        {month}
      </p>
      <p className="font-display text-2xl text-moss-800 leading-none">
        {d.getDate()}
      </p>
      <p className="text-[10px] font-mono text-ink-500 mt-0.5">
        {d.toLocaleTimeString("es", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

function RescuedCard({
  animal,
  index,
}: {
  animal: { id: string; nombre: string; especie: string; fechaIngreso: string; pesoActual: number };
  index: number;
}) {
  const tones = ["bg-clay-50", "bg-sun-300", "bg-moss-100"];
  const days = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(animal.fechaIngreso).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  return (
    <Card className="p-5 relative overflow-hidden">
      <div
        className={`absolute -top-6 -right-6 w-28 h-28 rounded-full ${tones[index % 3]}`}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <PawIcon size={16} color="#ff6e52" />
          <span className="font-hand text-lg text-clay-500 leading-none">
            llegó hace {days} día{days === 1 ? "" : "s"}
          </span>
        </div>
        <p className="font-display text-2xl text-moss-800 leading-tight">
          {animal.nombre}
        </p>
        <p className="text-sm text-ink-500 mt-1">
          {animal.especie} · {Number(animal.pesoActual).toFixed(2)} kg
        </p>
        <div className="mt-4">
          <CollarTag tone="moss">en cuidado</CollarTag>
        </div>
      </div>
    </Card>
  );
}

function QuickAction({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-5 rounded-xl2 bg-white border border-moss-100 hover:border-moss-400 transition-colors group"
    >
      <span className="w-11 h-11 rounded-full bg-clay-50 text-clay-500 flex items-center justify-center">
        {icon}
      </span>
      <div className="flex-1">
        <p className="font-semibold text-moss-800">{title}</p>
        <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>
      </div>
      <ArrowRight
        size={16}
        className="text-ink-400 group-hover:text-moss-700 group-hover:translate-x-0.5 transition-all"
      />
    </Link>
  );
}
