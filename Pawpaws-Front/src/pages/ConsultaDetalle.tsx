import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../components/Button";
import { Card, ErrorBox, Spinner } from "../components/Card";
import { Input, Select, Textarea } from "../components/Field";
import { Modal } from "../components/Modal";
import { Badge, estadoTone } from "../components/Badge";
import { useFetch } from "../hooks/useFetch";
import {
  animalesApi,
  consultasApi,
  productosApi,
  serviciosApi,
  veterinariosApi,
} from "../api/endpoints";
import type { EstadoConsulta, ProductoUsadoDto } from "../types";

const ESTADOS: EstadoConsulta[] = [
  "Pendiente",
  "Confirmada",
  "Cancelada",
  "Completada",
];

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ConsultaDetalle() {
  const { codigo = "" } = useParams();
  const decoded = decodeURIComponent(codigo);

  const consulta = useFetch(() => consultasApi.get(decoded), [decoded]);
  const animales = useFetch(() => animalesApi.list());
  const veterinarios = useFetch(() => veterinariosApi.list());
  const servicios = useFetch(() => serviciosApi.list());
  const productos = useFetch(() => productosApi.list());

  // Diagnóstico
  const [diag, setDiag] = useState({
    diagnostico: "",
    indicacionesSeguimiento: "",
  });
  const [diagSaving, setDiagSaving] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);

  // Productos
  const [usados, setUsados] = useState<ProductoUsadoDto[]>([]);
  const [prodSaving, setProdSaving] = useState(false);
  const [prodError, setProdError] = useState<string | null>(null);

  // Estado modal
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [estadoForm, setEstadoForm] = useState<string>("Pendiente");
  const [estadoSaving, setEstadoSaving] = useState(false);
  const [estadoError, setEstadoError] = useState<string | null>(null);

  // Reprogramar modal
  const [reprogOpen, setReprogOpen] = useState(false);
  const [reprogForm, setReprogForm] = useState("");
  const [reprogSaving, setReprogSaving] = useState(false);
  const [reprogError, setReprogError] = useState<string | null>(null);

  // Observaciones (inline edit)
  const [editObs, setEditObs] = useState(false);
  const [obsForm, setObsForm] = useState("");
  const [obsSaving, setObsSaving] = useState(false);
  const [obsError, setObsError] = useState<string | null>(null);

  // Editar consulta (fecha + obs + servicios)
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fechaHora: "",
    observaciones: "",
    servicioIds: [] as string[],
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (consulta.data) {
      setEstadoForm(consulta.data.estado);
      setReprogForm(toLocalDatetime(consulta.data.fechaHora));
      setObsForm(consulta.data.observaciones);
    }
  }, [consulta.data]);

  const animal = useMemo(
    () =>
      consulta.data
        ? (animales.data ?? []).find((a) => a.id === consulta.data!.animalId)
        : undefined,
    [animales.data, consulta.data]
  );
  const vet = useMemo(
    () =>
      consulta.data
        ? (veterinarios.data ?? []).find(
            (v) => v.id === consulta.data!.veterinarioId
          )
        : undefined,
    [veterinarios.data, consulta.data]
  );
  const serviciosAsignados = useMemo(() => {
    if (!consulta.data) return [];
    const ids = new Set(consulta.data.servicioIds);
    return (servicios.data ?? []).filter((s) => ids.has(s.id));
  }, [servicios.data, consulta.data]);

  const productosById = useMemo(
    () => Object.fromEntries((productos.data ?? []).map((p) => [p.id, p])),
    [productos.data]
  );

  const productosUsados = consulta.data?.productosUsados ?? [];

  const estado = consulta.data?.estado ?? "";
  const esTerminal =
    estado === "Completada" || estado === "Cancelada";

  const loading = consulta.loading || animales.loading || veterinarios.loading;

  async function guardarDiagnostico(e: React.FormEvent) {
    e.preventDefault();
    setDiagSaving(true);
    setDiagError(null);
    try {
      await consultasApi.registrarDiagnostico(decoded, diag);
      consulta.reload();
      setDiag({ diagnostico: "", indicacionesSeguimiento: "" });
    } catch (err: any) {
      setDiagError(err.message);
    } finally {
      setDiagSaving(false);
    }
  }

  async function guardarProductos(e: React.FormEvent) {
    e.preventDefault();
    if (usados.length === 0) {
      setProdError("Agrega al menos un producto.");
      return;
    }
    setProdSaving(true);
    setProdError(null);
    try {
      await consultasApi.registrarProductos(decoded, usados);
      productos.reload();
      consulta.reload();
      setUsados([]);
    } catch (err: any) {
      setProdError(err.message);
    } finally {
      setProdSaving(false);
    }
  }

  async function guardarEstado(e: React.FormEvent) {
    e.preventDefault();
    setEstadoSaving(true);
    setEstadoError(null);
    try {
      await consultasApi.cambiarEstado(decoded, { estado: estadoForm });
      consulta.reload();
      setEstadoOpen(false);
    } catch (err: any) {
      setEstadoError(err.message);
    } finally {
      setEstadoSaving(false);
    }
  }

  async function guardarReprogramar(e: React.FormEvent) {
    e.preventDefault();
    setReprogSaving(true);
    setReprogError(null);
    try {
      await consultasApi.reprogramar(decoded, {
        fechaHora: new Date(reprogForm).toISOString(),
      });
      consulta.reload();
      setReprogOpen(false);
    } catch (err: any) {
      setReprogError(err.message);
    } finally {
      setReprogSaving(false);
    }
  }

  async function guardarObservaciones() {
    setObsSaving(true);
    setObsError(null);
    try {
      await consultasApi.actualizarObservaciones(decoded, {
        observaciones: obsForm,
      });
      consulta.reload();
      setEditObs(false);
    } catch (err: any) {
      setObsError(err.message);
    } finally {
      setObsSaving(false);
    }
  }

  function abrirEditar() {
    if (!consulta.data) return;
    setEditForm({
      fechaHora: toLocalDatetime(consulta.data.fechaHora),
      observaciones: consulta.data.observaciones,
      servicioIds: [...consulta.data.servicioIds],
    });
    setEditError(null);
    setEditOpen(true);
  }

  async function guardarEditar(e: React.FormEvent) {
    e.preventDefault();
    if (editForm.servicioIds.length === 0) {
      setEditError("Debe haber al menos un servicio.");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await consultasApi.actualizar(decoded, {
        fechaHora: new Date(editForm.fechaHora).toISOString(),
        observaciones: editForm.observaciones,
        servicioIds: editForm.servicioIds,
      });
      consulta.reload();
      setEditOpen(false);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  function toggleEditServicio(id: string) {
    setEditForm((prev) =>
      prev.servicioIds.includes(id)
        ? {
            ...prev,
            servicioIds: prev.servicioIds.filter((s) => s !== id),
          }
        : { ...prev, servicioIds: [...prev.servicioIds, id] }
    );
  }

  function addProducto() {
    setUsados((u) => [...u, { productoId: "", cantidadUsada: 1 }]);
  }

  function updateProducto(i: number, patch: Partial<ProductoUsadoDto>) {
    setUsados((u) => u.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function removeProducto(i: number) {
    setUsados((u) => u.filter((_, idx) => idx !== i));
  }

  return (
    <>
      <Link
        to="/consultas"
        className="inline-flex items-center gap-1.5 text-sm text-moss-700 mb-5 hover:underline"
      >
        <ArrowLeft size={14} /> Volver a consultas
      </Link>

      {consulta.error && <ErrorBox message={consulta.error} />}
      {loading && <Spinner />}

      {consulta.data && (
        <>
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge tone={estadoTone(consulta.data.estado)}>
                {consulta.data.estado}
              </Badge>
              <span className="font-mono text-xs text-ink-500">
                {consulta.data.codigo}
              </span>
              {!esTerminal && (
                <button
                  onClick={() => setEstadoOpen(true)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-moss-700 hover:text-moss-800 ml-1"
                >
                  <RefreshCw size={11} /> Cambiar estado
                </button>
              )}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-moss-800 leading-tight">
              Consulta de{" "}
              <span className="text-clay-500">
                {animal?.nombre ?? "—"}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <p className="text-ink-500">
                {new Date(consulta.data.fechaHora).toLocaleString("es", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" · "}
                Dr/a. {vet?.nombreCompleto ?? "—"}
              </p>
              {!esTerminal && (
                <>
                  <button
                    onClick={() => setReprogOpen(true)}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-moss-700 hover:text-moss-800"
                  >
                    <CalendarClock size={12} /> Reprogramar
                  </button>
                  <button
                    onClick={abrirEditar}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-moss-700 hover:text-moss-800"
                  >
                    <Pencil size={12} /> Editar consulta
                  </button>
                </>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Observaciones */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs uppercase tracking-[0.18em] text-clay-500 font-bold">
                    Observaciones
                  </h2>
                  {!editObs && !esTerminal && (
                    <button
                      onClick={() => {
                        setObsForm(consulta.data!.observaciones);
                        setEditObs(true);
                      }}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-moss-700 hover:text-moss-800"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                  )}
                </div>

                {editObs ? (
                  <div className="space-y-3">
                    <Textarea
                      value={obsForm}
                      rows={4}
                      onChange={(e) => setObsForm(e.target.value)}
                    />
                    {obsError && <ErrorBox message={obsError} />}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditObs(false);
                          setObsError(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={guardarObservaciones}
                        disabled={obsSaving}
                      >
                        {obsSaving ? "Guardando…" : "Guardar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-ink-700 leading-relaxed whitespace-pre-line">
                    {consulta.data.observaciones || "—"}
                  </p>
                )}
              </Card>

              {/* Diagnóstico */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl text-moss-800">
                    Diagnóstico y seguimiento
                  </h2>
                  <ClipboardList size={18} className="text-moss-500" />
                </div>

                {consulta.data.diagnostico ||
                consulta.data.indicacionesSeguimiento ? (
                  <div className="space-y-4 mb-6">
                    {consulta.data.diagnostico && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-clay-500 font-bold mb-1">
                          Diagnóstico
                        </p>
                        <p className="text-ink-700 leading-relaxed">
                          {consulta.data.diagnostico}
                        </p>
                      </div>
                    )}
                    {consulta.data.indicacionesSeguimiento && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-clay-500 font-bold mb-1">
                          Indicaciones de seguimiento
                        </p>
                        <p className="text-ink-700 leading-relaxed">
                          {consulta.data.indicacionesSeguimiento}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-ink-500 mb-4">
                    Aún no se ha registrado un diagnóstico.
                  </p>
                )}

                {estado !== "Cancelada" && (
                  <form
                    onSubmit={guardarDiagnostico}
                    className="space-y-3 pt-4 border-t border-moss-100"
                  >
                    <p className="font-hand text-xl text-clay-500 leading-none">
                      {consulta.data.diagnostico
                        ? "actualizar"
                        : "registrar diagnóstico"}
                    </p>
                    <Textarea
                      label="Diagnóstico"
                      required
                      value={diag.diagnostico}
                      onChange={(e) =>
                        setDiag({ ...diag, diagnostico: e.target.value })
                      }
                    />
                    <Textarea
                      label="Indicaciones de seguimiento"
                      required
                      value={diag.indicacionesSeguimiento}
                      onChange={(e) =>
                        setDiag({
                          ...diag,
                          indicacionesSeguimiento: e.target.value,
                        })
                      }
                    />
                    {diagError && <ErrorBox message={diagError} />}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={diagSaving}>
                        {diagSaving ? "Guardando…" : "Guardar diagnóstico"}
                      </Button>
                    </div>
                  </form>
                )}
              </Card>

              {/* Productos */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl text-moss-800">
                    Productos utilizados
                  </h2>
                  <Package size={18} className="text-moss-500" />
                </div>

                {productosUsados.length > 0 ? (
                  <ul className="divide-y divide-moss-100 mb-5">
                    {productosUsados.map((p, i) => {
                      const prod = productosById[p.productoId];
                      return (
                        <li
                          key={`${p.productoId}-${i}`}
                          className="flex items-center justify-between py-2.5"
                        >
                          <div>
                            <p className="font-semibold text-moss-800">
                              {prod?.nombre ?? "Producto"}
                            </p>
                            <p className="text-xs text-ink-500">
                              {prod?.tipo ?? "—"}
                            </p>
                          </div>
                          <span className="font-mono text-sm text-clay-500 font-semibold">
                            {p.cantidadUsada} {prod?.unidadMedida ?? ""}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-500 mb-4">
                    No se han registrado productos para esta consulta.
                  </p>
                )}

                {estado !== "Cancelada" && (
                  <form
                    onSubmit={guardarProductos}
                    className="space-y-3 pt-4 border-t border-moss-100"
                  >
                    <p className="font-hand text-xl text-clay-500 leading-none mb-1">
                      registrar uso
                    </p>
                    <p className="text-xs text-ink-500 mb-2">
                      Cada producto registrado descuenta del inventario.
                    </p>

                    {usados.map((p, i) => {
                      const prod = productosById[p.productoId];
                      return (
                        <div
                          key={i}
                          className="flex items-end gap-2 p-3 rounded-2xl bg-bone-100 border border-bone-200"
                        >
                          <div className="flex-1">
                            <Select
                              label="Producto"
                              value={p.productoId}
                              onChange={(e) =>
                                updateProducto(i, {
                                  productoId: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Selecciona…</option>
                              {(productos.data ?? []).map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.nombre} ({x.stockDisponible}{" "}
                                  {x.unidadMedida})
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="w-28">
                            <Input
                              label="Cantidad"
                              hint={prod?.unidadMedida}
                              type="number"
                              min="1"
                              required
                              value={p.cantidadUsada || ""}
                              onChange={(e) =>
                                updateProducto(i, {
                                  cantidadUsada:
                                    parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProducto(i)}
                            className="h-11 w-11 rounded-full text-clay-500 hover:bg-clay-50 flex items-center justify-center"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addProducto}
                      icon={<Plus size={14} />}
                    >
                      Agregar producto
                    </Button>

                    {prodError && <ErrorBox message={prodError} />}

                    {usados.length > 0 && (
                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={prodSaving}>
                          {prodSaving ? "Guardando…" : "Registrar uso"}
                        </Button>
                      </div>
                    )}
                  </form>
                )}
              </Card>
            </div>

            <aside className="space-y-4">
              {/* Acciones rápidas */}
              {!esTerminal && (
                <Card className="p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-clay-500 font-bold mb-3">
                    Acciones rápidas
                  </p>
                  <div className="space-y-2">
                    {estado === "Pendiente" && (
                      <Button
                        size="sm"
                        className="w-full justify-center"
                        icon={<CheckCheck size={14} />}
                        onClick={async () => {
                          try {
                            await consultasApi.cambiarEstado(decoded, {
                              estado: "Confirmada",
                            });
                            consulta.reload();
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }}
                      >
                        Confirmar consulta
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full justify-center"
                      icon={<X size={14} />}
                      onClick={async () => {
                        if (
                          !confirm(
                            "¿Cancelar esta consulta? No podrá deshacerse."
                          )
                        )
                          return;
                        try {
                          await consultasApi.cambiarEstado(decoded, {
                            estado: "Cancelada",
                          });
                          consulta.reload();
                        } catch (err: any) {
                          alert(err.message);
                        }
                      }}
                    >
                      Cancelar consulta
                    </Button>
                  </div>
                </Card>
              )}

              <Card className="p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-clay-500 font-bold mb-3">
                  Paciente
                </p>
                {animal ? (
                  <>
                    <p className="font-display text-xl text-moss-800">
                      {animal.nombre}
                    </p>
                    <p className="text-sm text-ink-500 mt-0.5">
                      {animal.especie} ·{" "}
                      {Number(animal.pesoActual).toFixed(2)} kg
                    </p>
                    <p className="text-[11.5px] text-ink-500 mt-2">
                      Ingreso{" "}
                      {new Date(animal.fechaIngreso).toLocaleDateString("es")}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-ink-500">—</p>
                )}
              </Card>

              <Card className="p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-clay-500 font-bold mb-3">
                  Veterinario
                </p>
                {vet ? (
                  <>
                    <p className="font-semibold text-moss-800">
                      {vet.nombreCompleto}
                    </p>
                    <Badge tone="clay">{vet.especialidadPrincipal}</Badge>
                    <p className="text-xs font-mono text-ink-500 mt-2">
                      {vet.telefonoContacto}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-ink-500">—</p>
                )}
              </Card>

              <Card className="p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-clay-500 font-bold mb-3">
                  Servicios
                </p>
                {serviciosAsignados.length === 0 ? (
                  <p className="text-sm text-ink-500">Sin servicios</p>
                ) : (
                  <ul className="space-y-2">
                    {serviciosAsignados.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-ink-700">{s.nombre}</span>
                        <span className="text-[11px] font-mono text-ink-500">
                          {s.duracionEstimadaMinutos}′
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </aside>
          </div>

          {/* Modal: cambiar estado */}
          <Modal
            open={estadoOpen}
            onClose={() => setEstadoOpen(false)}
            title="Cambiar estado"
            subtitle={`Estado actual: ${estado}`}
          >
            <form onSubmit={guardarEstado} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {ESTADOS.map((e) => {
                  const active = estadoForm === e;
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEstadoForm(e)}
                      className={`px-3 py-3 rounded-2xl border-2 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-moss-700 border-moss-700 text-white"
                          : "bg-white border-bone-200 hover:border-moss-300"
                      }`}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
              {estadoError && <ErrorBox message={estadoError} />}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEstadoOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={estadoSaving}>
                  {estadoSaving ? "Guardando…" : "Cambiar estado"}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Modal: reprogramar */}
          <Modal
            open={reprogOpen}
            onClose={() => setReprogOpen(false)}
            title="Reprogramar consulta"
            subtitle="Elige una nueva fecha y hora."
          >
            <form onSubmit={guardarReprogramar} className="space-y-4">
              <Input
                label="Nueva fecha y hora"
                type="datetime-local"
                required
                value={reprogForm}
                onChange={(e) => setReprogForm(e.target.value)}
              />
              {reprogError && <ErrorBox message={reprogError} />}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setReprogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={reprogSaving}>
                  {reprogSaving ? "Guardando…" : "Reprogramar"}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Modal: editar consulta */}
          <Modal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            title="Editar consulta"
            subtitle="Actualiza fecha, observaciones y servicios."
            size="lg"
          >
            <form onSubmit={guardarEditar} className="space-y-4">
              <Input
                label="Fecha y hora"
                type="datetime-local"
                required
                value={editForm.fechaHora}
                onChange={(e) =>
                  setEditForm({ ...editForm, fechaHora: e.target.value })
                }
              />
              <Textarea
                label="Observaciones"
                required
                value={editForm.observaciones}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    observaciones: e.target.value,
                  })
                }
              />
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-moss-700 mb-2 px-1">
                  Servicios
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(servicios.data ?? []).map((s) => {
                    const active = editForm.servicioIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleEditServicio(s.id)}
                        className={`text-left px-3 py-2.5 rounded-2xl border-2 text-sm transition-colors ${
                          active
                            ? "bg-moss-700 border-moss-700 text-white"
                            : "bg-white border-bone-200 hover:border-moss-300"
                        }`}
                      >
                        <p className="font-semibold">{s.nombre}</p>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            active ? "text-bone-100" : "text-ink-500"
                          }`}
                        >
                          {s.duracionEstimadaMinutos} min
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              {editError && <ErrorBox message={editError} />}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving ? "Guardando…" : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </>
  );
}
