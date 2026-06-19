import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, ChevronRight } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input } from "../components/Field";
import { Combobox } from "../components/Combobox";
import { Modal } from "../components/Modal";
import { Badge } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { animalesApi, organizacionesApi, rescatistasApi } from "../api/endpoints";
import type { CrearOrganizacionDto, Organizacion, Rescatista } from "../types";

const emptyForm: CrearOrganizacionDto = { nombre: "", tipo: "" };

export const TIPOS_ORGANIZACION = [
  "ONG",
  "Autoridad ambiental",
  "Refugio",
  "Independiente",
];
const TIPO_OPTIONS = TIPOS_ORGANIZACION.map((t) => ({ value: t, label: t }));

// Valor especial de acción al eliminar una org: dar de baja al rescatista.
const BAJA = "__baja__";

export function Organizaciones() {
  const { puedeGestionarAnimales } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() =>
    organizacionesApi.list()
  );
  const rescatistas = useFetch(() => rescatistasApi.list());
  const animales = useFetch(() => animalesApi.list());

  // Cuántos animales tiene cada rescatista (para reasignar al darlo de baja).
  const animalesPorRescatista = useMemo(() => {
    const map = new Map<string, number>();
    (animales.data ?? []).forEach((a) =>
      map.set(a.rescatistaId, (map.get(a.rescatistaId) ?? 0) + 1)
    );
    return map;
  }, [animales.data]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Organizacion | null>(null);
  const [form, setForm] = useState<CrearOrganizacionDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Eliminación con decisión por rescatista.
  const [toDelete, setToDelete] = useState<Organizacion | null>(null);
  // rescatistaId -> orgId (mover) | BAJA (dar de baja).
  const [acciones, setAcciones] = useState<Record<string, string>>({});
  // Al dar de baja: rescatistaId -> destino de sus animales ("" = Refugio interno).
  const [destinoAnimales, setDestinoAnimales] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const rescatistasDeOrg = (orgId: string) =>
    (rescatistas.data ?? []).filter((r) => !r.oculto && r.organizacionId === orgId);

  const enBaja = useMemo(
    () => (toDelete ? rescatistasDeOrg(toDelete.id) : []),
    [toDelete, rescatistas.data]
  );

  // Opciones por rescatista: mover a otra org activa, o darlo de baja.
  const accionOptions = useMemo(() => {
    if (!toDelete) return [];
    const otras = (data ?? [])
      .filter((o) => o.id !== toDelete.id)
      .map((o) => ({ value: o.id, label: `Mover a ${o.nombre}`, hint: o.tipo }));
    return [...otras, { value: BAJA, label: "Dar de baja al rescatista" }];
  }, [toDelete, data]);

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

  function abrirEliminar(o: Organizacion) {
    const lista = rescatistasDeOrg(o.id);
    const otraOrg = (data ?? []).find((x) => x.id !== o.id);
    // Acción por defecto: mover a la primera otra organización; si no hay, dar de baja.
    const porDefecto = otraOrg ? otraOrg.id : BAJA;
    const inicial: Record<string, string> = {};
    const destinos: Record<string, string> = {};
    lista.forEach((r) => {
      inicial[r.id] = porDefecto;
      destinos[r.id] = ""; // Refugio por defecto.
    });
    setAcciones(inicial);
    setDestinoAnimales(destinos);
    setDeleteError(null);
    setToDelete(o);
  }

  // Destino para los animales de un rescatista dado de baja: otros rescatistas activos
  // (no los que también se dan de baja) + el Refugio interno.
  const destinoAnimalOptions = (rescatistaId: string) => [
    { value: "", label: "Refugio (interno)" },
    ...(rescatistas.data ?? [])
      .filter(
        (r) => !r.oculto && r.id !== rescatistaId && acciones[r.id] !== BAJA
      )
      .map((r) => ({ value: r.id, label: r.nombreCompleto, hint: r.organizacion })),
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tipo) {
      setSubmitError("Selecciona el tipo de organización.");
      return;
    }
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

  async function confirmarEliminar() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      // Aplica la acción elegida por cada rescatista de la organización.
      for (const r of enBaja) {
        const accion = acciones[r.id];
        if (accion === BAJA) {
          // Sus animales se reasignan al destino elegido (o al Refugio si se deja vacío).
          await rescatistasApi.remove(r.id, destinoAnimales[r.id] || undefined);
        } else {
          await moverRescatista(r, accion);
        }
      }
      await organizacionesApi.remove(toDelete.id);
      toast.success(`Se dio de baja “${toDelete.nombre}”.`);
      setToDelete(null);
      reload();
      rescatistas.reload();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function moverRescatista(r: Rescatista, organizacionId: string) {
    return rescatistasApi.update(r.id, {
      nombreCompleto: r.nombreCompleto,
      telefonoContacto: r.telefonoContacto,
      correoElectronico: r.correoElectronico,
      organizacionId,
      zonaOperacion: r.zonaOperacion,
    });
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
                      <th className="text-left font-semibold px-5 py-3">Rescatistas</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-moss-100">
                    {data.map((o) => (
                      <tr key={o.id} className="hover:bg-bone-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/organizaciones/${o.id}`}
                            className="group flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-moss-100 text-moss-700 flex items-center justify-center shrink-0">
                              <Building2 size={15} />
                            </div>
                            <span className="font-medium text-moss-800 group-hover:text-moss-600 group-hover:underline decoration-moss-300 underline-offset-2">
                              {o.nombre}
                            </span>
                            <ChevronRight size={14} className="text-ink-500/30 group-hover:text-moss-600" />
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone="blue">{o.tipo}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-ink-500">
                          {rescatistasDeOrg(o.id).length}
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
                                onClick={() => abrirEliminar(o)}
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

      {/* Crear / editar */}
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
          <Combobox
            label="Tipo"
            value={form.tipo}
            onChange={(v) => setForm({ ...form, tipo: v })}
            options={TIPO_OPTIONS}
            placeholder="Selecciona un tipo…"
            searchPlaceholder="Buscar tipo…"
          />

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

      {/* Eliminar con decisión por rescatista */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminar organización"
        subtitle={
          toDelete
            ? `Vas a dar de baja “${toDelete.nombre}”.`
            : undefined
        }
      >
        <div className="space-y-4">
          {enBaja.length === 0 ? (
            <p className="text-sm text-ink-600 leading-relaxed">
              Esta organización no tiene rescatistas asignados. Se dará de baja
              directamente.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-600 leading-relaxed">
                Tiene <strong>{enBaja.length}</strong> rescatista
                {enBaja.length === 1 ? "" : "s"}. Decidí qué hacer con cada uno
                antes de eliminarla:
              </p>
              <div className="space-y-3">
                {enBaja.map((r) => {
                  const nAnimales = animalesPorRescatista.get(r.id) ?? 0;
                  const esBaja = (acciones[r.id] ?? BAJA) === BAJA;
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-bone-200 p-3 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-moss-800 truncate">
                            {r.nombreCompleto}
                          </p>
                          {nAnimales > 0 && (
                            <p className="text-[11px] text-ink-500">
                              {nAnimales} animal{nAnimales === 1 ? "" : "es"} a su cargo
                            </p>
                          )}
                        </div>
                        <div className="sm:w-60">
                          <Combobox
                            value={acciones[r.id] ?? BAJA}
                            onChange={(v) =>
                              setAcciones((prev) => ({ ...prev, [r.id]: v }))
                            }
                            options={accionOptions}
                            searchPlaceholder="Buscar acción…"
                          />
                        </div>
                      </div>

                      {/* Si se da de baja y tiene animales, elegir a dónde van. */}
                      {esBaja && nAnimales > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pl-1">
                          <span className="text-[12px] text-ink-500 sm:w-40 shrink-0">
                            Sus animales →
                          </span>
                          <div className="flex-1">
                            <Combobox
                              value={destinoAnimales[r.id] ?? ""}
                              onChange={(v) =>
                                setDestinoAnimales((prev) => ({ ...prev, [r.id]: v }))
                              }
                              options={destinoAnimalOptions(r.id)}
                              searchPlaceholder="Buscar rescatista…"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-ink-500">
                Al dar de baja a un rescatista, sus animales se reasignan al
                destino que elijas (por defecto, al Refugio interno).
              </p>
            </>
          )}

          {deleteError && <ErrorBox message={deleteError} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarEliminar} disabled={deleting}>
              {deleting ? "Procesando…" : "Eliminar organización"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
