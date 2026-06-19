import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Mail, Phone, MapPin, PawPrint, Eye } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input } from "../components/Field";
import { Combobox } from "../components/Combobox";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { animalesApi, organizacionesApi, rescatistasApi } from "../api/endpoints";
import type { Animal, CrearRescatistaDto, Rescatista } from "../types";

const emptyForm: CrearRescatistaDto = {
  nombreCompleto: "",
  telefonoContacto: "",
  correoElectronico: "",
  organizacionId: "",
  zonaOperacion: "",
};

export function Rescatistas() {
  const { puedeGestionarAnimales } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() =>
    rescatistasApi.list()
  );
  const animales = useFetch(() => animalesApi.list());
  const organizaciones = useFetch(() => organizacionesApi.list());
  const animalesPorRescatista = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const animal of animales.data ?? []) {
      conteo.set(animal.rescatistaId, (conteo.get(animal.rescatistaId) ?? 0) + 1);
    }
    return conteo;
  }, [animales.data]);
  const organizacionOptions = useMemo(
    () =>
      (organizaciones.data ?? []).map((o) => ({
        value: o.id,
        label: o.nombre,
        hint: o.tipo,
      })),
    [organizaciones.data]
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rescatista | null>(null);
  const [form, setForm] = useState<CrearRescatistaDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Eliminación con reasignación de animales.
  const [toDelete, setToDelete] = useState<Rescatista | null>(null);
  const [delAnimals, setDelAnimals] = useState<Animal[] | null>(null); // null = cargando
  const [reasignarA, setReasignarA] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // El Refugio (y cualquier rescatista interno) no se muestra ni se gestiona desde la UI.
  const visibles = useMemo(
    () => (data ?? []).filter((r) => !r.oculto),
    [data]
  );

  const reasignarOpciones = useMemo(
    () =>
      visibles
        .filter((r) => r.id !== toDelete?.id)
        .map((r) => ({
          value: r.id,
          label: r.nombreCompleto,
          hint: r.organizacion,
        })),
    [visibles, toDelete]
  );

  function openDelete(r: Rescatista) {
    setToDelete(r);
    setDelAnimals(null);
    setReasignarA("");
    setDeleteError(null);
    animalesApi
      .porRescatista(r.id)
      .then(setDelAnimals)
      .catch(() => setDelAnimals([]));
  }

  async function confirmarEliminar() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const nombre = toDelete.nombreCompleto;
      await rescatistasApi.remove(toDelete.id, reasignarA || undefined);
      toast.success(`Se eliminó a ${nombre} y se reasignaron sus animales.`);
      setToDelete(null);
      reload();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSubmitError(null);
    setOpen(true);
  }

  function openEdit(r: Rescatista) {
    setEditing(r);
    setForm({
      nombreCompleto: r.nombreCompleto,
      telefonoContacto: r.telefonoContacto,
      correoElectronico: r.correoElectronico,
      organizacionId: r.organizacionId ?? "",
      zonaOperacion: r.zonaOperacion,
    });
    setSubmitError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.organizacionId) {
      setSubmitError("Selecciona una organización.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editing) {
        await rescatistasApi.update(editing.id, form);
        toast.success(`Se actualizó a ${form.nombreCompleto}.`);
      } else {
        await rescatistasApi.create(form);
        toast.success(`${form.nombreCompleto} se registró como rescatista.`);
      }
      setOpen(false);
      reload();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Red de rescate"
        title="Rescatistas"
        description="Personas y organizaciones que traen animales al centro. Mantén su información al día."
        actions={
          puedeGestionarAnimales ? (
            <Button onClick={openCreate} icon={<Plus size={16} />}>
              Nuevo rescatista
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}

      {!loading && data && visibles.length === 0 && (
        <Card>
          <EmptyState
            title="Sin rescatistas registrados"
            description="Comienza creando el primer rescatista para poder ingresar animales al sistema."
            action={
              puedeGestionarAnimales ? (
                <Button onClick={openCreate} icon={<Plus size={16} />}>
                  Crear rescatista
                </Button>
              ) : undefined
            }
          />
        </Card>
      )}

      {!loading && data && visibles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibles.map((r) => (
            <Card key={r.id} className="p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-moss-100 text-moss-700 font-display text-lg flex items-center justify-center">
                  {r.nombreCompleto.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/rescatistas/${r.id}`}
                    className="font-medium text-moss-800 hover:text-moss-600 hover:underline decoration-moss-300 underline-offset-2 truncate block"
                  >
                    {r.nombreCompleto}
                  </Link>
                  <p className="text-xs text-clay-600 font-medium mt-0.5">
                    {r.organizacion}
                  </p>
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between rounded-xl bg-bone-50 px-3 py-2">
                <span className="text-xs font-medium text-ink-500">
                  Animales asignados
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-moss-100 px-2.5 py-1 text-xs font-semibold text-moss-700">
                  <PawPrint size={14} />
                  {animalesPorRescatista.get(r.id) ?? 0}
                </span>
              </div>
              <ul className="space-y-1.5 text-sm text-ink-500">
                <li className="flex items-center gap-2">
                  <Phone size={13} className="shrink-0 text-moss-500" />
                  <span className="font-mono text-[12.5px]">
                    {r.telefonoContacto}
                  </span>
                </li>
                <li className="flex items-center gap-2 truncate">
                  <Mail size={13} className="shrink-0 text-moss-500" />
                  <span className="truncate">{r.correoElectronico}</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={13} className="shrink-0 text-moss-500" />
                  {r.zonaOperacion}
                </li>
              </ul>
              <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-moss-100">
                <Link to={`/rescatistas/${r.id}`}>
                  <Button size="sm" variant="ghost" icon={<Eye size={14} />}>
                    Ver ficha
                  </Button>
                </Link>
                {puedeGestionarAnimales && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-clay-600 hover:bg-clay-50"
                      onClick={() => openDelete(r)}
                    >
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar rescatista" : "Nuevo rescatista"}
        subtitle="Registra a la persona u organización que ingresa animales al centro."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            required
            minLength={2}
            maxLength={120}
            value={form.nombreCompleto}
            onChange={(e) =>
              setForm({ ...form, nombreCompleto: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Teléfono"
              type="tel"
              required
              minLength={6}
              maxLength={30}
              pattern="[0-9+\-\s()]{6,30}"
              title="Solo dígitos, espacios y los signos + - ( )"
              placeholder="555-1001"
              value={form.telefonoContacto}
              onChange={(e) =>
                setForm({ ...form, telefonoContacto: e.target.value })
              }
            />
            <Input
              label="Correo"
              type="email"
              required
              maxLength={120}
              placeholder="nombre@correo.com"
              value={form.correoElectronico}
              onChange={(e) =>
                setForm({ ...form, correoElectronico: e.target.value })
              }
            />
          </div>
          <Combobox
            label="Organización"
            value={form.organizacionId}
            onChange={(v) => setForm({ ...form, organizacionId: v })}
            options={organizacionOptions}
            placeholder="Selecciona una organización…"
            searchPlaceholder="Buscar organización…"
            emptyText="No hay organizaciones. Creá una primero."
          />
          <Input
            label="Zona de operación"
            required
            maxLength={120}
            value={form.zonaOperacion}
            onChange={(e) => setForm({ ...form, zonaOperacion: e.target.value })}
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
                : "Crear rescatista"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!toDelete}
        onClose={() => (deleting ? undefined : setToDelete(null))}
        title="Dar de baja rescatista"
        subtitle={
          toDelete ? `Vas a eliminar a ${toDelete.nombreCompleto}.` : undefined
        }
      >
        {delAnimals === null ? (
          <div className="py-6">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {delAnimals.length === 0 ? (
              <p className="text-sm text-ink-600">
                Este rescatista no tiene animales asociados. Se dará de baja y
                dejará de aparecer en los listados.
              </p>
            ) : (
              <>
                <p className="text-sm text-ink-600">
                  Tiene{" "}
                  <strong>
                    {delAnimals.length} animal
                    {delAnimals.length === 1 ? "" : "es"}
                  </strong>
                  . Los animales no pueden quedar sin rescatista, así que se
                  reasignarán antes de eliminarlo.
                </p>
                {reasignarOpciones.length > 0 ? (
                  <>
                    <Combobox
                      label="Reasignar animales a"
                      value={reasignarA}
                      onChange={setReasignarA}
                      options={reasignarOpciones}
                      placeholder="Refugio (por defecto)"
                      searchPlaceholder="Buscar rescatista…"
                      emptyText="No hay rescatistas"
                    />
                    <p className="text-xs text-ink-500">
                      Si no eliges ninguno, los animales pasarán al{" "}
                      <strong>Refugio</strong>.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-ink-600 rounded-xl bg-bone-100 border border-bone-200 px-3 py-2.5">
                    No hay otros rescatistas disponibles. Los animales pasarán
                    automáticamente al <strong>Refugio</strong>.
                  </p>
                )}
              </>
            )}

            {deleteError && <ErrorBox message={deleteError} />}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setToDelete(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={confirmarEliminar}
                disabled={deleting}
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
