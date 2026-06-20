import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  ChevronRight,
  Search,
  CalendarDays,
  List as ListIcon,
} from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input, Textarea } from "../components/Field";
import { Combobox } from "../components/Combobox";
import { ServicioPicker } from "../components/ServicioPicker";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Badge, estadoTone } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { useFetch } from "../hooks/useFetch";
import { usePaginated } from "../hooks/usePaginated";
import { useToast } from "../components/Toast";
import {
  animalesApi,
  consultasApi,
  serviciosApi,
  veterinariosApi,
} from "../api/endpoints";
import type { Animal, Consulta, CrearConsultaDto, EstadoConsulta, Veterinario } from "../types";

const estados: EstadoConsulta[] = [
  "Pendiente",
  "Confirmada",
  "Cancelada",
  "Completada",
];

// Al agendar, una consulta solo puede nacer Pendiente o Confirmada. "Completada" requiere
// diagnóstico/productos (se cargan después de atender) y "Cancelada" no aplica al crear.
const estadosCreacion: EstadoConsulta[] = ["Pendiente", "Confirmada"];

function nowLocalDatetime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function defaultCodigo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `C-${ymd}-${r}`;
}

const emptyForm = (): CrearConsultaDto => ({
  codigo: defaultCodigo(),
  fechaHora: nowLocalDatetime(),
  estado: "Pendiente",
  observaciones: "",
  animalId: "",
  veterinarioId: "",
  servicioIds: [],
});

export function Consultas() {
  const toast = useToast();
  const consultas = useFetch(() => consultasApi.list());
  const animales = useFetch(() => animalesApi.list());
  const veterinarios = useFetch(() => veterinariosApi.list());
  const servicios = useFetch(() => serviciosApi.list());

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CrearConsultaDto>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [vetFilter, setVetFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<"lista" | "agenda">(
    searchParams.get("vista") === "agenda" ? "agenda" : "lista"
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

  const vetFilterOptions = useMemo(
    () => [
      { value: "", label: "Todos los veterinarios" },
      ...(veterinarios.data ?? []).map((v) => ({
        value: v.id,
        label: v.nombreCompleto,
        hint: v.especialidadPrincipal,
      })),
    ],
    [veterinarios.data]
  );

  const filtered = useMemo(() => {
    const cs = consultas.data ?? [];
    // Ocultar consultas huérfanas: su animal ya no existe (fue eliminado).
    const conAnimal = animales.data
      ? cs.filter((c) => animalesById[c.animalId])
      : cs;
    const term = search.trim().toLowerCase();
    const list = conAnimal.filter((c) => {
      if (estadoFilter && c.estado !== estadoFilter) return false;
      if (vetFilter && c.veterinarioId !== vetFilter) return false;
      if (term) {
        const animal = animalesById[c.animalId];
        const haystack = `${c.codigo} ${animal?.nombre ?? ""} ${
          animal?.especie ?? ""
        }`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    return [...list].sort(
      (a, b) =>
        new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
    );
  }, [
    consultas.data,
    animales.data,
    animalesById,
    estadoFilter,
    vetFilter,
    search,
  ]);

  const { page, setPage, pageCount, pageItems, total } = usePaginated(
    filtered,
    10,
    `${search}|${estadoFilter}|${vetFilter}`
  );

  // Turnos de hoy: pendientes/confirmadas con fecha de hoy (para el resumen de agenda).
  const turnosHoy = useMemo(
    () =>
      (consultas.data ?? []).filter(
        (c) =>
          (c.estado === "Pendiente" || c.estado === "Confirmada") &&
          dayDiff(new Date(c.fechaHora)) === 0 &&
          animalesById[c.animalId]
      ).length,
    [consultas.data, animalesById]
  );

  function openCreate() {
    setForm(emptyForm());
    setSubmitError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    if (!form.animalId || !form.veterinarioId) {
      setSubmitError("Selecciona animal y veterinario.");
      setSubmitting(false);
      return;
    }
    if (form.servicioIds.length === 0) {
      setSubmitError("Selecciona al menos un servicio.");
      setSubmitting(false);
      return;
    }
    try {
      await consultasApi.create({
        ...form,
        fechaHora: new Date(form.fechaHora).toISOString(),
      });
      toast.success(`Consulta ${form.codigo} agendada.`);
      setOpen(false);
      consultas.reload();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleServicio(id: string) {
    setForm((prev) =>
      prev.servicioIds.includes(id)
        ? { ...prev, servicioIds: prev.servicioIds.filter((s) => s !== id) }
        : { ...prev, servicioIds: [...prev.servicioIds, id] }
    );
  }

  const loading =
    consultas.loading ||
    animales.loading ||
    veterinarios.loading ||
    servicios.loading;

  return (
    <>
      <PageHeader
        eyebrow="Agenda clínica"
        title="Consultas"
        description="El núcleo del centro: cada cita combina animal, veterinario y servicios. Aquí queda el historial."
        actions={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Agendar consulta
          </Button>
        }
      />

      {consultas.error && <ErrorBox message={consultas.error} />}
      {loading && <Spinner />}

      {!loading && consultas.data && (
        <>
          <div className="flex flex-col gap-3 mb-5">
            <div className="flex gap-2 flex-wrap items-center">
              <FilterChip
                label="Todas"
                active={!estadoFilter}
                onClick={() => setEstadoFilter("")}
              />
              {estados.map((e) => (
                <FilterChip
                  key={e}
                  label={e}
                  active={estadoFilter === e}
                  onClick={() => setEstadoFilter(e)}
                />
              ))}
              <div className="ml-auto inline-flex rounded-full bg-bone-100 p-1">
                <ViewToggle
                  active={view === "lista"}
                  onClick={() => setView("lista")}
                  icon={<ListIcon size={14} />}
                  label="Lista"
                />
                <ViewToggle
                  active={view === "agenda"}
                  onClick={() => setView("agenda")}
                  icon={<CalendarDays size={14} />}
                  label="Agenda"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500/60"
                />
                <input
                  placeholder="Buscar por código, animal o especie…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-moss-200/50 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-moss-500"
                />
              </div>
              <div className="sm:w-64">
                <Combobox
                  value={vetFilter}
                  onChange={setVetFilter}
                  options={vetFilterOptions}
                  placeholder="Todos los veterinarios"
                  searchPlaceholder="Buscar veterinario…"
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                title="No hay consultas"
                description="Agenda una consulta para iniciar el seguimiento clínico de un animal."
                action={
                  <Button onClick={openCreate} icon={<Plus size={16} />}>
                    Agendar consulta
                  </Button>
                }
              />
            </Card>
          ) : view === "agenda" ? (
            <Agenda
              consultas={filtered}
              animalesById={animalesById}
              vetsById={vetsById}
              turnosHoy={turnosHoy}
            />
          ) : (
            <>
            <div className="grid grid-cols-1 gap-3">
              {pageItems.map((c) => {
                const animal = animalesById[c.animalId];
                const vet = vetsById[c.veterinarioId];
                const date = new Date(c.fechaHora);
                return (
                  <Link
                    key={c.codigo}
                    to={`/consultas/${encodeURIComponent(c.codigo)}`}
                    className="group"
                  >
                    <Card className="p-5 hover:border-moss-400 transition-colors">
                      <div className="flex items-center gap-5">
                        <div className="w-14 text-center shrink-0">
                          <p className="text-[10px] uppercase tracking-wider text-clay-600 font-semibold">
                            {date
                              .toLocaleDateString("es", { month: "short" })
                              .toUpperCase()}
                          </p>
                          <p className="font-display text-3xl text-moss-800 leading-none">
                            {date.getDate()}
                          </p>
                          <p className="text-[10.5px] font-mono text-ink-500 mt-0.5">
                            {date.toLocaleTimeString("es", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <div className="border-l border-moss-100 pl-5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge tone={estadoTone(c.estado)}>
                              {c.estado}
                            </Badge>
                            <span className="text-[11px] font-mono text-ink-500">
                              {c.codigo}
                            </span>
                          </div>
                          <p className="font-medium text-moss-800 truncate">
                            {animal?.nombre ?? "Animal"}{" "}
                            <span className="text-ink-500/60">
                              · {animal?.especie ?? "—"}
                            </span>
                          </p>
                          <p className="text-xs text-ink-500 truncate mt-0.5">
                            Dr/a. {vet?.nombreCompleto ?? "Veterinario"} ·{" "}
                            {c.servicioIds.length} servicio
                            {c.servicioIds.length === 1 ? "" : "s"}
                          </p>
                        </div>

                        <ChevronRight
                          size={18}
                          className="text-ink-500/40 group-hover:text-moss-700 transition-colors shrink-0"
                        />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              onChange={setPage}
              total={total}
            />
            </>
          )}
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Agendar consulta"
        subtitle="Necesitas animal, veterinario y al menos un servicio para crear una consulta."
        size="lg"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código"
              hint="único"
              required
              minLength={3}
              maxLength={60}
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
            <Input
              label="Fecha y hora"
              type="datetime-local"
              required
              value={form.fechaHora}
              onChange={(e) =>
                setForm({ ...form, fechaHora: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Combobox
              label="Animal"
              value={form.animalId}
              onChange={(v) => setForm({ ...form, animalId: v })}
              options={(animales.data ?? [])
                .filter((a) => a.estado !== "Adoptado")
                .map((a) => ({
                  value: a.id,
                  label: a.nombre,
                  hint: a.especie,
                }))}
              placeholder="Selecciona…"
              searchPlaceholder="Buscar animal…"
              emptyText="No hay animales disponibles"
            />
            <Combobox
              label="Veterinario"
              value={form.veterinarioId}
              onChange={(v) => setForm({ ...form, veterinarioId: v })}
              options={(veterinarios.data ?? []).map((v) => ({
                value: v.id,
                label: v.nombreCompleto,
                hint: v.especialidadPrincipal,
              }))}
              placeholder="Selecciona…"
              searchPlaceholder="Buscar veterinario…"
              emptyText="No hay veterinarios"
            />
          </div>

          <Combobox
            label="Estado inicial"
            value={form.estado}
            onChange={(v) => setForm({ ...form, estado: v })}
            options={estadosCreacion.map((e) => ({ value: e, label: e }))}
            searchPlaceholder="Buscar estado…"
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-moss-700 mb-2">
              Servicios
            </p>
            <ServicioPicker
              servicios={servicios.data ?? []}
              selectedIds={form.servicioIds}
              onToggle={toggleServicio}
            />
          </div>

          <Textarea
            label="Observaciones"
            maxLength={500}
            value={form.observaciones}
            onChange={(e) =>
              setForm({ ...form, observaciones: e.target.value })
            }
          />

          {submitError && <ErrorBox message={submitError} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando…" : "Crear consulta"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? "bg-moss-700 text-bone-50"
          : "bg-bone-100 text-ink-500 hover:text-moss-800 hover:bg-bone-200"
      }`}
    >
      {label}
    </button>
  );
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        active
          ? "bg-white text-moss-800 shadow-soft"
          : "text-ink-500 hover:text-moss-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Agenda: agrupa las consultas por cercanía temporal (qué tengo hoy / esta semana) ──

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Días de diferencia (en días-calendario) entre una fecha y hoy. 0 = hoy, 1 = mañana, -1 = ayer. */
function dayDiff(target: Date): number {
  const hoy = startOfDay(new Date()).getTime();
  const t = startOfDay(target).getTime();
  return Math.round((t - hoy) / 86_400_000);
}

interface AgendaProps {
  consultas: Consulta[];
  animalesById: Record<string, Animal>;
  vetsById: Record<string, Veterinario>;
  turnosHoy: number;
}

const BUCKETS = [
  { key: "hoy", label: "Hoy", test: (d: number) => d === 0 },
  { key: "manana", label: "Mañana", test: (d: number) => d === 1 },
  { key: "semana", label: "Esta semana", test: (d: number) => d >= 2 && d <= 7 },
  { key: "adelante", label: "Más adelante", test: (d: number) => d > 7 },
  { key: "anteriores", label: "Anteriores", test: (d: number) => d < 0 },
];

function Agenda({ consultas, animalesById, vetsById, turnosHoy }: AgendaProps) {
  const grupos = BUCKETS.map((bucket) => {
    const items = consultas
      .filter((c) => bucket.test(dayDiff(new Date(c.fechaHora))))
      .sort((a, b) => {
        const ta = new Date(a.fechaHora).getTime();
        const tb = new Date(b.fechaHora).getTime();
        // Las pasadas se muestran de la más reciente a la más vieja; el resto, cronológico.
        return bucket.key === "anteriores" ? tb - ta : ta - tb;
      });
    return { ...bucket, items };
  }).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gradient-to-br from-moss-700 to-moss-800 text-white border-0">
        <p className="font-hand text-2xl text-clay-300 leading-none">la agenda de hoy</p>
        <p className="font-display text-3xl mt-1">
          {turnosHoy === 0
            ? "Sin turnos para hoy"
            : `${turnosHoy} turno${turnosHoy === 1 ? "" : "s"} para hoy`}
        </p>
        <p className="text-[13px] text-bone-200/90 mt-1">
          {new Date().toLocaleDateString("es", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </Card>

      {grupos.map((g) => (
        <div key={g.key}>
          <div className="flex items-center gap-2 mb-2.5">
            <h3 className="font-display text-xl text-moss-800">{g.label}</h3>
            <span className="text-[11px] font-mono text-ink-500 bg-bone-100 rounded-full px-2 py-0.5">
              {g.items.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {g.items.map((c) => {
              const animal = animalesById[c.animalId];
              const vet = vetsById[c.veterinarioId];
              const date = new Date(c.fechaHora);
              return (
                <Link
                  key={c.codigo}
                  to={`/consultas/${encodeURIComponent(c.codigo)}`}
                  className="group"
                >
                  <Card className="px-4 py-3 hover:border-moss-400 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 shrink-0 text-center">
                        <p className="font-mono text-base text-moss-800 font-semibold leading-none">
                          {date.toLocaleTimeString("es", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {g.key !== "hoy" && g.key !== "manana" && (
                          <p className="text-[10px] uppercase tracking-wide text-ink-500 mt-1">
                            {date.toLocaleDateString("es", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        )}
                      </div>
                      <div className="border-l border-moss-100 pl-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge tone={estadoTone(c.estado)}>{c.estado}</Badge>
                          <span className="font-medium text-moss-800 truncate">
                            {animal?.nombre ?? "Animal"}
                          </span>
                          <span className="text-ink-500/60 text-sm truncate">
                            · {animal?.especie ?? "—"}
                          </span>
                        </div>
                        <p className="text-xs text-ink-500 truncate mt-0.5">
                          Dr/a. {vet?.nombreCompleto ?? "Veterinario"}
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-ink-500/40 group-hover:text-moss-700 transition-colors shrink-0"
                      />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
