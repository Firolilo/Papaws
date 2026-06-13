import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input, Select, Textarea } from "../components/Field";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Badge, estadoTone } from "../components/Badge";
import { useFetch } from "../hooks/useFetch";
import {
  animalesApi,
  consultasApi,
  serviciosApi,
  veterinariosApi,
} from "../api/endpoints";
import type { CrearConsultaDto, EstadoConsulta } from "../types";

const estados: EstadoConsulta[] = [
  "Pendiente",
  "Confirmada",
  "Cancelada",
  "Completada",
];

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
  const consultas = useFetch(() => consultasApi.list());
  const animales = useFetch(() => animalesApi.list());
  const veterinarios = useFetch(() => veterinariosApi.list());
  const servicios = useFetch(() => serviciosApi.list());

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CrearConsultaDto>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>("");

  const animalesById = useMemo(
    () => Object.fromEntries((animales.data ?? []).map((a) => [a.id, a])),
    [animales.data]
  );
  const vetsById = useMemo(
    () =>
      Object.fromEntries((veterinarios.data ?? []).map((v) => [v.id, v])),
    [veterinarios.data]
  );

  const filtered = useMemo(() => {
    const cs = consultas.data ?? [];
    const list = estadoFilter ? cs.filter((c) => c.estado === estadoFilter) : cs;
    return [...list].sort(
      (a, b) =>
        new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
    );
  }, [consultas.data, estadoFilter]);

  function openCreate() {
    setForm(emptyForm());
    setSubmitError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
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
          <div className="flex gap-2 mb-5 flex-wrap">
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
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((c) => {
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
            <Select
              label="Animal"
              required
              value={form.animalId}
              onChange={(e) =>
                setForm({ ...form, animalId: e.target.value })
              }
            >
              <option value="">Selecciona…</option>
              {(animales.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} · {a.especie}
                </option>
              ))}
            </Select>
            <Select
              label="Veterinario"
              required
              value={form.veterinarioId}
              onChange={(e) =>
                setForm({ ...form, veterinarioId: e.target.value })
              }
            >
              <option value="">Selecciona…</option>
              {(veterinarios.data ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombreCompleto} · {v.especialidadPrincipal}
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="Estado"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
          >
            {estados.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </Select>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-moss-700 mb-2">
              Servicios
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(servicios.data ?? []).map((s) => {
                const active = form.servicioIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleServicio(s.id)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      active
                        ? "bg-moss-700 border-moss-700 text-bone-50"
                        : "bg-bone-50 border-moss-200/60 hover:border-moss-400"
                    }`}
                  >
                    <p className="font-medium">{s.nombre}</p>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        active ? "text-bone-200/80" : "text-ink-500"
                      }`}
                    >
                      {s.duracionEstimadaMinutos} min
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            label="Observaciones"
            required
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
