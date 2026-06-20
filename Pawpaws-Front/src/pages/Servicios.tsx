import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Clock, Eye } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input, Textarea } from "../components/Field";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { useToast } from "../components/Toast";
import { serviciosApi } from "../api/endpoints";
import type { CrearServicioDto, Servicio } from "../types";

const emptyForm: CrearServicioDto = {
  nombre: "",
  descripcion: "",
  duracionEstimadaMinutos: 30,
  precioBase: 0,
};

const fmt = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 0,
  useGrouping: false,
});

export function Servicios() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() => serviciosApi.list());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [form, setForm] = useState<CrearServicioDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Servicio | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSubmitError(null);
    setOpen(true);
  }

  function openEdit(s: Servicio) {
    setEditing(s);
    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion,
      duracionEstimadaMinutos: s.duracionEstimadaMinutos,
      precioBase: s.precioBase,
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
        await serviciosApi.update(editing.id, form);
        toast.success(`Se actualizó el servicio “${form.nombre}”.`);
      } else {
        await serviciosApi.create(form);
        toast.success(`Servicio “${form.nombre}” creado.`);
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
        eyebrow="Catálogo"
        title="Servicios"
        description="Los procedimientos que el centro ofrece. Cada consulta combina uno o varios servicios."
        actions={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Nuevo servicio
          </Button>
        }
      />

      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}

      {!loading && data && data.length === 0 && (
        <Card>
          <EmptyState
            title="Sin servicios"
            description="Define qué procedimientos puede ofrecer el centro: consulta, vacunación, cirugía…"
            action={
              <Button onClick={openCreate} icon={<Plus size={16} />}>
                Crear servicio
              </Button>
            }
          />
        </Card>
      )}

      {!loading && data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((s) => (
            <Card key={s.id} className="p-6">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <Link
                  to={`/servicios/${s.id}`}
                  className="font-display text-xl text-moss-800 hover:text-moss-600 hover:underline decoration-moss-300 underline-offset-2"
                >
                  {s.nombre}
                </Link>
                <span className="font-mono text-sm text-clay-600 font-semibold whitespace-nowrap">
                  {fmt.format(s.precioBase)}
                </span>
              </div>
              <p className="text-sm text-ink-500 leading-relaxed mb-4">
                {s.descripcion}
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[12.5px] text-moss-700">
                  <Clock size={13} />
                  {s.duracionEstimadaMinutos} min estimados
                </div>
                <div className="flex gap-1">
                  <Link to={`/servicios/${s.id}`}>
                    <Button size="sm" variant="ghost" icon={<Eye size={14} />}>
                      Ver ficha
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-clay-600 hover:bg-clay-50"
                    onClick={() => setToDelete(s)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar servicio" : "Nuevo servicio"}
        subtitle="Define un procedimiento que el centro ofrecerá en consultas."
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
          <Textarea
            label="Descripción"
            required
            minLength={2}
            maxLength={300}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duración"
              hint="min"
              type="number"
              min="1"
              max="1440"
              step="1"
              required
              value={form.duracionEstimadaMinutos || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  duracionEstimadaMinutos: parseInt(e.target.value) || 0,
                })
              }
            />
            <Input
              label="Precio base"
              type="number"
              min="0"
              max="999999"
              step="100"
              required
              value={form.precioBase || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  precioBase: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

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
                : "Crear servicio"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Dar de baja servicio"
        message={
          <>
            ¿Dar de baja el servicio <strong>{toDelete?.nombre}</strong>? Dejará
            de aparecer en los listados.
          </>
        }
        tone="danger"
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (toDelete) {
            const nombre = toDelete.nombre;
            await serviciosApi.remove(toDelete.id);
            toast.success(`Se dio de baja el servicio “${nombre}”.`);
            reload();
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
