import { useState } from "react";
import { Plus, Phone } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input } from "../components/Field";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { useFetch } from "../hooks/useFetch";
import { veterinariosApi } from "../api/endpoints";
import type { CrearVeterinarioDto } from "../types";

const emptyForm: CrearVeterinarioDto = {
  nombreCompleto: "",
  telefonoContacto: "",
  especialidadPrincipal: "",
};

export function Veterinarios() {
  const { data, error, loading, reload } = useFetch(() =>
    veterinariosApi.list()
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CrearVeterinarioDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await veterinariosApi.create(form);
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
        eyebrow="Equipo clínico"
        title="Veterinarios"
        description="Profesionales que atienden cada consulta. Su especialidad guía la asignación de casos."
        actions={
          <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>
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
              <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>
                Crear veterinario
              </Button>
            }
          />
        </Card>
      )}

      {!loading && data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((v) => (
            <Card key={v.id} className="p-5">
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
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo veterinario"
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando…" : "Crear veterinario"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
