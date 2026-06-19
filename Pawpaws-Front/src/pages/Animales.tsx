import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input } from "../components/Field";
import { Combobox } from "../components/Combobox";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { Badge, Tone } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { animalesApi, rescatistasApi } from "../api/endpoints";
import type { Animal, CrearAnimalDto } from "../types";

const emptyForm: CrearAnimalDto = {
  nombre: "",
  especie: "",
  pesoActual: 0,
  rescatistaId: "",
};

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

export function Animales() {
  const { puedeGestionarAnimales } = useAuth();
  const toast = useToast();
  const animales = useFetch(() => animalesApi.list());
  const rescatistas = useFetch(() => rescatistasApi.list());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Animal | null>(null);
  const [form, setForm] = useState<CrearAnimalDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [especieFilter, setEspecieFilter] = useState("");
  const [rescatistaFilter, setRescatistaFilter] = useState("");
  const [toDelete, setToDelete] = useState<Animal | null>(null);

  const rescById = useMemo(
    () =>
      Object.fromEntries(
        (rescatistas.data ?? []).map((r) => [r.id, r.nombreCompleto])
      ),
    [rescatistas.data]
  );

  const especies = useMemo(
    () => Array.from(new Set((animales.data ?? []).map((a) => a.especie))),
    [animales.data]
  );

  const especieOptions = useMemo(
    () => [
      { value: "", label: "Todas las especies" },
      ...especies.map((e) => ({ value: e, label: e })),
    ],
    [especies]
  );

  const rescatistaOptions = useMemo(
    () =>
      (rescatistas.data ?? [])
        .filter((r) => !r.oculto)
        .map((r) => ({
          value: r.id,
          label: r.nombreCompleto,
          hint: r.organizacion,
        })),
    [rescatistas.data]
  );

  // Filtro por rescatista: solo los que tienen al menos un animal ingresado.
  const rescatistaFilterOptions = useMemo(() => {
    const conAnimales = new Set((animales.data ?? []).map((a) => a.rescatistaId));
    return [
      { value: "", label: "Todos los rescatistas" },
      ...(rescatistas.data ?? [])
        .filter((r) => conAnimales.has(r.id))
        .map((r) => ({ value: r.id, label: r.nombreCompleto })),
    ];
  }, [rescatistas.data, animales.data]);

  const filtered = useMemo(() => {
    const term = filter.toLowerCase();
    return (animales.data ?? []).filter(
      (a) =>
        (especieFilter ? a.especie === especieFilter : true) &&
        (rescatistaFilter ? a.rescatistaId === rescatistaFilter : true) &&
        (term
          ? a.nombre.toLowerCase().includes(term) ||
            a.especie.toLowerCase().includes(term)
          : true)
    );
  }, [animales.data, filter, especieFilter, rescatistaFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSubmitError(null);
    setOpen(true);
  }

  function openEdit(a: Animal) {
    setEditing(a);
    setForm({
      nombre: a.nombre,
      especie: a.especie,
      pesoActual: a.pesoActual,
      rescatistaId: a.rescatistaId,
    });
    setSubmitError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.rescatistaId) {
      setSubmitError("Selecciona un rescatista.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editing) {
        await animalesApi.update(editing.id, form);
        toast.success(`Se actualizó la ficha de ${form.nombre}.`);
      } else {
        await animalesApi.create(form);
        toast.success(`${form.nombre} ingresó al centro.`);
      }
      setOpen(false);
      animales.reload();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const loading = animales.loading || rescatistas.loading;

  return (
    <>
      <PageHeader
        eyebrow="Cuidado clínico"
        title="Animales"
        description="Cada rescate tiene una historia. Lleva el control de su especie, peso e ingreso al centro."
        actions={
          puedeGestionarAnimales ? (
            <Button onClick={openCreate} icon={<Plus size={16} />}>
              Ingresar animal
            </Button>
          ) : undefined
        }
      />

      {animales.error && <ErrorBox message={animales.error} />}
      {loading && <Spinner />}

      {!loading && animales.data && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500/60"
              />
              <input
                placeholder="Buscar por nombre o especie…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-white border border-moss-200/50 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-moss-500"
              />
            </div>
            <div className="sm:w-52">
              <Combobox
                value={especieFilter}
                onChange={setEspecieFilter}
                options={especieOptions}
                placeholder="Todas las especies"
                searchPlaceholder="Buscar especie…"
              />
            </div>
            <div className="sm:w-56">
              <Combobox
                value={rescatistaFilter}
                onChange={setRescatistaFilter}
                options={rescatistaFilterOptions}
                placeholder="Todos los rescatistas"
                searchPlaceholder="Buscar rescatista…"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                title="No hay animales"
                description="Ingresa un animal rescatado para llevar su historial clínico aquí."
                action={
                  puedeGestionarAnimales ? (
                    <Button onClick={openCreate} icon={<Plus size={16} />}>
                      Ingresar animal
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bone-100/60 text-ink-500 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="text-left font-semibold px-5 py-3">
                        Nombre
                      </th>
                      <th className="text-left font-semibold px-5 py-3">
                        Especie
                      </th>
                      <th className="text-left font-semibold px-5 py-3">
                        Estado
                      </th>
                      <th className="text-right font-semibold px-5 py-3">
                        Peso
                      </th>
                      <th className="text-left font-semibold px-5 py-3">
                        Ingreso
                      </th>
                      <th className="text-left font-semibold px-5 py-3">
                        Rescatista
                      </th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-moss-100">
                    {filtered.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-bone-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/animales/${a.id}`}
                            className="group flex items-center gap-3 -my-1 py-1"
                          >
                            <div className="w-8 h-8 rounded-full bg-clay-100 text-clay-600 font-display flex items-center justify-center text-sm">
                              {a.nombre.charAt(0)}
                            </div>
                            <span className="font-medium text-moss-800 group-hover:text-moss-600 group-hover:underline decoration-moss-300 underline-offset-2">
                              {a.nombre}
                            </span>
                            <ChevronRight
                              size={14}
                              className="text-ink-500/30 group-hover:text-moss-600 transition-colors"
                            />
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-ink-500">
                          {a.especie}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={ESTADO_TONE[a.estado] ?? "neutral"}>
                            {ESTADO_LABEL[a.estado] ?? a.estado}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-[12.5px]">
                          {Number(a.pesoActual).toFixed(2)} kg
                        </td>
                        <td className="px-5 py-3.5 text-ink-500 text-[12.5px]">
                          {new Date(a.fechaIngreso).toLocaleDateString("es")}
                        </td>
                        <td className="px-5 py-3.5 text-ink-500">
                          {rescById[a.rescatistaId] ?? "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {puedeGestionarAnimales && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEdit(a)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-clay-600 hover:bg-clay-50"
                                onClick={() => setToDelete(a)}
                              >
                                Eliminar
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar animal" : "Ingresar animal"}
        subtitle={
          editing
            ? "Actualiza la información clínica del animal."
            : "Registra el ingreso de un animal rescatado. Necesitas un rescatista registrado."
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nombre"
            required
            maxLength={100}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Especie"
              required
              maxLength={80}
              placeholder="Puma, Loro, Tortuga…"
              value={form.especie}
              onChange={(e) => setForm({ ...form, especie: e.target.value })}
            />
            <Input
              label="Peso actual"
              hint="kg"
              type="number"
              step="0.01"
              min="0.01"
              max="1000"
              required
              value={form.pesoActual || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  pesoActual: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <Combobox
            label="Rescatista"
            value={form.rescatistaId}
            onChange={(v) => setForm({ ...form, rescatistaId: v })}
            options={rescatistaOptions}
            placeholder="Selecciona un rescatista…"
            searchPlaceholder="Buscar rescatista…"
            emptyText="No hay rescatistas"
          />

          {submitError && <ErrorBox message={submitError} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Guardando…"
                : editing
                ? "Guardar cambios"
                : "Ingresar animal"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar animal"
        message={
          <>
            ¿Eliminar a <strong>{toDelete?.nombre}</strong>? Esta acción no se
            puede deshacer.
          </>
        }
        tone="danger"
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (toDelete) {
            const nombre = toDelete.nombre;
            await animalesApi.remove(toDelete.id);
            toast.success(`Se eliminó a ${nombre}.`);
            animales.reload();
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
