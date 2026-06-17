import { useState } from "react";
import { Plus, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input } from "../components/Field";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../auth/AuthContext";
import { rescatistasApi } from "../api/endpoints";
import type { CrearRescatistaDto } from "../types";

const emptyForm: CrearRescatistaDto = {
  nombreCompleto: "",
  telefonoContacto: "",
  correoElectronico: "",
  organizacion: "",
  zonaOperacion: "",
};

export function Rescatistas() {
  const { puedeGestionarAnimales } = useAuth();
  const { data, error, loading, reload } = useFetch(() =>
    rescatistasApi.list()
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CrearRescatistaDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await rescatistasApi.create(form);
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
        eyebrow="Red de rescate"
        title="Rescatistas"
        description="Personas y organizaciones que traen animales al centro. Mantén su información al día."
        actions={
          puedeGestionarAnimales ? (
            <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>
              Nuevo rescatista
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}

      {!loading && data && data.length === 0 && (
        <Card>
          <EmptyState
            title="Sin rescatistas registrados"
            description="Comienza creando el primer rescatista para poder ingresar animales al sistema."
            action={
              puedeGestionarAnimales ? (
                <Button
                  onClick={() => setOpen(true)}
                  icon={<Plus size={16} />}
                >
                  Crear rescatista
                </Button>
              ) : undefined
            }
          />
        </Card>
      )}

      {!loading && data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-moss-100 text-moss-700 font-display text-lg flex items-center justify-center">
                  {r.nombreCompleto.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-moss-800 truncate">
                    {r.nombreCompleto}
                  </p>
                  <p className="text-xs text-clay-600 font-medium mt-0.5">
                    {r.organizacion}
                  </p>
                </div>
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
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo rescatista"
        subtitle="Registra a la persona u organización que ingresa animales al centro."
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Teléfono"
              required
              value={form.telefonoContacto}
              onChange={(e) =>
                setForm({ ...form, telefonoContacto: e.target.value })
              }
            />
            <Input
              label="Correo"
              type="email"
              required
              value={form.correoElectronico}
              onChange={(e) =>
                setForm({ ...form, correoElectronico: e.target.value })
              }
            />
          </div>
          <Input
            label="Organización"
            required
            placeholder="ONG, autoridad ambiental, independiente…"
            value={form.organizacion}
            onChange={(e) =>
              setForm({ ...form, organizacion: e.target.value })
            }
          />
          <Input
            label="Zona de operación"
            required
            value={form.zonaOperacion}
            onChange={(e) =>
              setForm({ ...form, zonaOperacion: e.target.value })
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
              {submitting ? "Guardando…" : "Crear rescatista"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
