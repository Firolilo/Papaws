import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input, Select } from "../components/Field";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../auth/AuthContext";
import { animalesApi, rescatistasApi } from "../api/endpoints";
import type { Animal, CrearAnimalDto } from "../types";

const emptyForm: CrearAnimalDto = {
  nombre: "",
  especie: "",
  pesoActual: 0,
  rescatistaId: "",
};

export function Animales() {
  const { puedeGestionarAnimales } = useAuth();
  const animales = useFetch(() => animalesApi.list());
  const rescatistas = useFetch(() => rescatistasApi.list());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Animal | null>(null);
  const [form, setForm] = useState<CrearAnimalDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [especieFilter, setEspecieFilter] = useState("");

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

  const filtered = useMemo(() => {
    const term = filter.toLowerCase();
    return (animales.data ?? []).filter(
      (a) =>
        (especieFilter ? a.especie === especieFilter : true) &&
        (term
          ? a.nombre.toLowerCase().includes(term) ||
            a.especie.toLowerCase().includes(term)
          : true)
    );
  }, [animales.data, filter, especieFilter]);

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
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editing) {
        await animalesApi.update(editing.id, form);
      } else {
        await animalesApi.create(form);
      }
      setOpen(false);
      animales.reload();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onEliminar(a: Animal) {
    if (!window.confirm(`¿Eliminar a "${a.nombre}"? Esta acción no se puede deshacer.`))
      return;
    try {
      await animalesApi.remove(a.id);
      animales.reload();
    } catch (err: any) {
      window.alert(err.message ?? "No se pudo eliminar.");
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
            <select
              value={especieFilter}
              onChange={(e) => setEspecieFilter(e.target.value)}
              className="bg-white border border-moss-200/50 rounded-lg px-3 py-2.5 text-sm focus:border-moss-500"
            >
              <option value="">Todas las especies</option>
              {especies.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
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
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-clay-100 text-clay-600 font-display flex items-center justify-center text-sm">
                              {a.nombre.charAt(0)}
                            </div>
                            <span className="font-medium text-moss-800">
                              {a.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-ink-500">
                          {a.especie}
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
                                onClick={() => onEliminar(a)}
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
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Especie"
              required
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
          <Select
            label="Rescatista"
            required
            value={form.rescatistaId}
            onChange={(e) =>
              setForm({ ...form, rescatistaId: e.target.value })
            }
          >
            <option value="">Selecciona un rescatista…</option>
            {(rescatistas.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombreCompleto} · {r.organizacion}
              </option>
            ))}
          </Select>

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
              {submitting
                ? "Guardando…"
                : editing
                ? "Guardar cambios"
                : "Ingresar animal"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
