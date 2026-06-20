import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Phone, Calendar, Eye } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input } from "../components/Field";
import { Combobox } from "../components/Combobox";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { useFetch } from "../hooks/useFetch";
import { usePaginated } from "../hooks/usePaginated";
import { useToast } from "../components/Toast";
import { consultasApi, veterinariosApi } from "../api/endpoints";
import { ESPECIALIDADES_VETERINARIAS } from "../constants";
import type { CrearVeterinarioDto, Veterinario } from "../types";

const ESPECIALIDAD_OPTIONS = ESPECIALIDADES_VETERINARIAS.map((e) => ({ value: e, label: e }));

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
  const consultas = useFetch(() => consultasApi.list());
  const { page, setPage, pageCount, pageItems, total } = usePaginated(
    data ?? [],
    10
  );
  const consultasEsteMesPorVeterinario = useMemo(() => {
    const conteo = new Map<string, number>();
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);

    for (const consulta of consultas.data ?? []) {
      const fecha = new Date(consulta.fechaHora);
      if (fecha < inicioMes || fecha >= finMes) continue;
      conteo.set(
        consulta.veterinarioId,
        (conteo.get(consulta.veterinarioId) ?? 0) + 1
      );
    }

    return conteo;
  }, [consultas.data]);
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
    if (!form.especialidadPrincipal) {
      setSubmitError("Selecciona una especialidad.");
      return;
    }
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
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pageItems.map((v) => (
            <Card key={v.id} className="p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-moss-700 text-bone-50 font-display text-lg flex items-center justify-center">
                  {v.nombreCompleto.charAt(0)}
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/veterinarios/${v.id}`}
                    className="font-medium text-moss-800 hover:text-moss-600 hover:underline decoration-moss-300 underline-offset-2 truncate block"
                  >
                    {v.nombreCompleto}
                  </Link>
                  <div className="mt-1.5">
                    <Badge tone="clay">{v.especialidadPrincipal}</Badge>
                  </div>
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between rounded-xl bg-bone-50 px-3 py-2">
                <span className="text-xs font-medium text-ink-500">
                  Consultas este mes
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-moss-100 px-2.5 py-1 text-xs font-semibold text-moss-700">
                  <Calendar size={14} />
                  {consultasEsteMesPorVeterinario.get(v.id) ?? 0}
                </span>
              </div>
              <p className="flex items-center gap-2 text-sm text-ink-500">
                <Phone size={13} className="text-moss-500" />
                <span className="font-mono text-[12.5px]">
                  {v.telefonoContacto}
                </span>
              </p>
              <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-moss-100">
                <Link to={`/veterinarios/${v.id}`}>
                  <Button size="sm" variant="ghost" icon={<Eye size={14} />}>
                    Ver ficha
                  </Button>
                </Link>
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
        <Pagination
          page={page}
          pageCount={pageCount}
          onChange={setPage}
          total={total}
        />
        </>
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
            minLength={2}
            maxLength={120}
            value={form.nombreCompleto}
            onChange={(e) =>
              setForm({ ...form, nombreCompleto: e.target.value })
            }
          />
          <Input
            label="Teléfono"
            type="tel"
            required
            minLength={6}
            maxLength={30}
            pattern="[0-9+\-\s()]{6,30}"
            title="Solo dígitos, espacios y los signos + - ( )"
            placeholder="555-2001"
            value={form.telefonoContacto}
            onChange={(e) =>
              setForm({ ...form, telefonoContacto: e.target.value })
            }
          />
          <Combobox
            label="Especialidad principal"
            value={form.especialidadPrincipal}
            onChange={(v) => setForm({ ...form, especialidadPrincipal: v })}
            options={ESPECIALIDAD_OPTIONS}
            placeholder="Selecciona una especialidad…"
            searchPlaceholder="Buscar especialidad…"
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
