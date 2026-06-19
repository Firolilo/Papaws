import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input } from "../components/Field";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { Badge } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { organizacionesApi } from "../api/endpoints";
import type { CrearOrganizacionDto, Organizacion } from "../types";

const emptyForm: CrearOrganizacionDto = { nombre: "", tipo: "" };

const TIPOS = ["ONG", "Autoridad ambiental", "Refugio", "Independiente"];

export function Organizaciones() {
  const { puedeGestionarAnimales } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() =>
    organizacionesApi.list()
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Organizacion | null>(null);
  const [form, setForm] = useState<CrearOrganizacionDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Organizacion | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSubmitError(null);
    setOpen(true);
  }

  function openEdit(o: Organizacion) {
    setEditing(o);
    setForm({ nombre: o.nombre, tipo: o.tipo });
    setSubmitError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editing) {
        await organizacionesApi.update(editing.id, form);
        toast.success(`Se actualizó “${form.nombre}”.`);
      } else {
        await organizacionesApi.create(form);
        toast.success(`Organización “${form.nombre}” creada.`);
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
        title="Organizaciones"
        description="ONG, autoridades y refugios a los que pertenecen los rescatistas que ingresan animales."
        actions={
          puedeGestionarAnimales ? (
            <Button onClick={openCreate} icon={<Plus size={16} />}>
              Nueva organización
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}

      {!loading && data && (
        <>
          {data.length === 0 ? (
            <Card>
              <EmptyState
                title="Sin organizaciones"
                description="Creá una organización para poder asignársela a los rescatistas."
                action={
                  puedeGestionarAnimales ? (
                    <Button onClick={openCreate} icon={<Plus size={16} />}>
                      Nueva organización
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
                      <th className="text-left font-semibold px-5 py-3">Nombre</th>
                      <th className="text-left font-semibold px-5 py-3">Tipo</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-moss-100">
                    {data.map((o) => (
                      <tr key={o.id} className="hover:bg-bone-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-moss-100 text-moss-700 flex items-center justify-center shrink-0">
                              <Building2 size={15} />
                            </div>
                            <span className="font-medium text-moss-800">{o.nombre}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone="blue">{o.tipo}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {puedeGestionarAnimales && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => openEdit(o)}>
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-clay-600 hover:bg-clay-50"
                                onClick={() => setToDelete(o)}
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
        title={editing ? "Editar organización" : "Nueva organización"}
        subtitle="Las organizaciones agrupan a los rescatistas que ingresan animales al centro."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nombre"
            required
            minLength={2}
            maxLength={120}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <div>
            <Input
              label="Tipo"
              required
              minLength={2}
              maxLength={80}
              list="tipos-organizacion"
              placeholder="ONG, Autoridad ambiental, Refugio…"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            />
            <datalist id="tipos-organizacion">
              {TIPOS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {submitError && <ErrorBox message={submitError} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando…" : editing ? "Guardar cambios" : "Crear organización"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar organización"
        message={
          <>
            ¿Dar de baja la organización <strong>{toDelete?.nombre}</strong>? Los
            rescatistas ya registrados conservan su organización; dejará de
            aparecer para nuevas asignaciones.
          </>
        }
        tone="danger"
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (toDelete) {
            const nombre = toDelete.nombre;
            await organizacionesApi.remove(toDelete.id);
            toast.success(`Se dio de baja “${nombre}”.`);
            reload();
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
