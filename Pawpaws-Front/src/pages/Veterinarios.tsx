import { useState } from "react";
import { Plus, Phone } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input } from "../components/Field";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { useFetch } from "../hooks/useFetch";
import { useToast } from "../components/Toast";
import { veterinariosApi } from "../api/endpoints";
import type { CrearVeterinarioDto, Veterinario } from "../types";

const emptyForm: CrearVeterinarioDto = {
  nombreCompleto: "",
  telefonoContacto: "",
  especialidadPrincipal: "",
};

export function Veterinarios() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() =>
    veterinariosApi.list()
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Veterinario | null>(null);
  const [form, setForm] = useState<CrearVeterinarioDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Veterinario | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSubmitError(null);
    setOpen(true);
  }

  function openEdit(v: Veterinario) {
    setEditing(v);
    setForm({
      nombreCompleto: v.nombreCompleto,
      telefonoContacto: v.telefonoContacto,
      especialidadPrincipal: v.especialidadPrincipal,
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
        await veterinariosApi.update(editing.id, form);
        toast.success(`Se actualizó a ${form.nombreCompleto}.`);
      } else {
        await veterinariosApi.create(form);
        toast.success(`${form.nombreCompleto} se sumó al equipo.`);
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
        eyebrow="Equipo clínico"
        title="Veterinarios"
        description="Profesionales que atienden cada consulta. Su especialidad guía la asignación de casos."
        actions={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Nuevo veterinario
          </Button>
        }
      />

      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}

      {!loading && data && data.length === 0 && (
        <Card>
          <EmptyState
            title="Aún no hay veterinarios"
            description="Necesitas registrar al equipo clínico para poder agendar consultas."
            action={
              <Button onClick={openCreate} icon={<Plus size={16} />}>
                Crear veterinario
              </Button>
            }
          />
        </Card>
      )}

      {!loading && data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((v) => (
            <Card key={v.id} className="p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-moss-700 text-bone-50 font-display text-lg flex items-center justify-center">
                  {v.nombreCompleto.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-moss-800 truncate">
                    {v.nombreCompleto}
                  </p>
                  <div className="mt-1.5">
                    <Badge tone="clay">{v.especialidadPrincipal}</Badge>
                  </div>
                </div>
              </div>
              <p className="flex items-center gap-2 text-sm text-ink-500">
                <Phone size={13} className="text-moss-500" />
                <span className="font-mono text-[12.5px]">
                  {v.telefonoContacto}
                </span>
              </p>
              <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-moss-100">
                <Button size="sm" variant="ghost" onClick={() => openEdit(v)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-clay-600 hover:bg-clay-50"
                  onClick={() => setToDelete(v)}
                >
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar veterinario" : "Nuevo veterinario"}
        subtitle="Registra al profesional que atenderá las consultas."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            required
            value={form.nombreCompleto}
            onChange={(e) =>
              setForm({ ...form, nombreCompleto: e.target.value })
            }
          />
          <Input
            label="Teléfono"
            required
            value={form.telefonoContacto}
            onChange={(e) =>
              setForm({ ...form, telefonoContacto: e.target.value })
            }
          />
          <Input
            label="Especialidad principal"
            placeholder="Cirugía, Dermatología, Medicina general…"
            required
            value={form.especialidadPrincipal}
            onChange={(e) =>
              setForm({ ...form, especialidadPrincipal: e.target.value })
            }
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
                : "Crear veterinario"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Dar de baja veterinario"
        message={
          <>
            ¿Dar de baja a <strong>{toDelete?.nombreCompleto}</strong>? Dejará de
            aparecer en los listados.
          </>
        }
        tone="danger"
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (toDelete) {
            const nombre = toDelete.nombreCompleto;
            await veterinariosApi.remove(toDelete.id);
            toast.success(`Se dio de baja a ${nombre}.`);
            reload();
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
