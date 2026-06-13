import { useState } from "react";
import { Plus, Clock } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input, Textarea } from "../components/Field";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { serviciosApi } from "../api/endpoints";
import type { CrearServicioDto } from "../types";

const emptyForm: CrearServicioDto = {
  nombre: "",
  descripcion: "",
  duracionEstimadaMinutos: 30,
  precioBase: 0,
};

const fmt = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function Servicios() {
  const { data, error, loading, reload } = useFetch(() => serviciosApi.list());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CrearServicioDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await serviciosApi.create(form);
      setForm(emptyForm);
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
          <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>
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
              <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>
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
                <h3 className="font-display text-xl text-moss-800">
                  {s.nombre}
                </h3>
                <span className="font-mono text-sm text-clay-600 font-semibold whitespace-nowrap">
                  {fmt.format(s.precioBase)}
                </span>
              </div>
              <p className="text-sm text-ink-500 leading-relaxed mb-4">
                {s.descripcion}
              </p>
              <div className="flex items-center gap-1.5 text-[12.5px] text-moss-700">
                <Clock size={13} />
                {s.duracionEstimadaMinutos} min estimados
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo servicio"
        subtitle="Define un procedimiento que el centro ofrecerá en consultas."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nombre"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <Textarea
            label="Descripción"
            required
            value={form.descripcion}
            onChange={(e) =>
              setForm({ ...form, descripcion: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duración"
              hint="min"
              type="number"
              min="1"
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando…" : "Crear servicio"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
