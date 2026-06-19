import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input } from "../components/Field";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { useFetch } from "../hooks/useFetch";
import { useToast } from "../components/Toast";
import { productosApi } from "../api/endpoints";
import type { CrearProductoDto, Producto } from "../types";

const emptyForm: CrearProductoDto = {
  nombre: "",
  tipo: "",
  unidadMedida: "",
  stockDisponible: 0,
  fechaVencimiento: "",
};

// Estado de vencimiento de un producto (para badges/colores).
function estadoVencimiento(iso?: string | null): { texto: string; tone: "red" | "sun" | "moss" } | null {
  if (!iso) return null;
  const dias = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (dias < 0) return { texto: "Vencido", tone: "red" };
  if (dias <= 30) return { texto: `Vence en ${dias}d`, tone: "sun" };
  return { texto: "Vigente", tone: "moss" };
}

export function Productos() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() => productosApi.list());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<CrearProductoDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Producto | null>(null);

  // Modal de stock
  const [stockTarget, setStockTarget] = useState<Producto | null>(null);
  const [stockValue, setStockValue] = useState("");
  const [stockSaving, setStockSaving] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSubmitError(null);
    setOpen(true);
  }

  function openEdit(p: Producto) {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      tipo: p.tipo,
      unidadMedida: p.unidadMedida,
      stockDisponible: p.stockDisponible,
      fechaVencimiento: p.fechaVencimiento
        ? new Date(p.fechaVencimiento).toISOString().slice(0, 10)
        : "",
    });
    setSubmitError(null);
    setOpen(true);
  }

  function openStock(p: Producto) {
    setStockTarget(p);
    setStockValue(String(p.stockDisponible));
    setStockError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const vencimiento = form.fechaVencimiento
        ? new Date(form.fechaVencimiento).toISOString()
        : null;
      if (editing) {
        // El stock se gestiona aparte; el PUT solo cambia datos descriptivos.
        await productosApi.update(editing.id, {
          nombre: form.nombre,
          tipo: form.tipo,
          unidadMedida: form.unidadMedida,
          fechaVencimiento: vencimiento,
        });
        toast.success(`Se actualizó “${form.nombre}”.`);
      } else {
        await productosApi.create({ ...form, fechaVencimiento: vencimiento });
        toast.success(`Producto “${form.nombre}” agregado al inventario.`);
      }
      setOpen(false);
      reload();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function guardarStock(e: React.FormEvent) {
    e.preventDefault();
    if (!stockTarget) return;
    const nuevo = parseInt(stockValue, 10);
    if (Number.isNaN(nuevo) || nuevo < 0) {
      setStockError("Ingresa un número válido (0 o mayor).");
      return;
    }
    setStockSaving(true);
    setStockError(null);
    try {
      await productosApi.establecerStock(stockTarget.id, {
        stockDisponible: nuevo,
      });
      toast.success(`Stock de “${stockTarget.nombre}” actualizado a ${nuevo}.`);
      setStockTarget(null);
      reload();
    } catch (err: any) {
      setStockError(err.message);
    } finally {
      setStockSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Productos"
        description="Medicamentos, insumos y materiales disponibles. El stock se ajusta al usarse en consultas."
        actions={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Nuevo producto
          </Button>
        }
      />

      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}

      {!loading && data && data.length === 0 && (
        <Card>
          <EmptyState
            title="Sin productos"
            description="Agrega tu inventario para registrar lo que se usa en cada consulta."
            action={
              <Button onClick={openCreate} icon={<Plus size={16} />}>
                Crear producto
              </Button>
            }
          />
        </Card>
      )}

      {!loading && data && data.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bone-100/60 text-ink-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Producto</th>
                  <th className="text-left font-semibold px-5 py-3">Tipo</th>
                  <th className="text-left font-semibold px-5 py-3">Unidad</th>
                  <th className="text-left font-semibold px-5 py-3">Vencimiento</th>
                  <th className="text-right font-semibold px-5 py-3">Stock</th>
                  <th className="text-left font-semibold px-5 py-3">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-moss-100">
                {data.map((p) => {
                  const low = p.stockDisponible <= 10;
                  const out = p.stockDisponible === 0;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-bone-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-moss-800">
                        {p.nombre}
                      </td>
                      <td className="px-5 py-3.5 text-ink-500">{p.tipo}</td>
                      <td className="px-5 py-3.5 text-ink-500 text-[12.5px] font-mono">
                        {p.unidadMedida}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.fechaVencimiento ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] text-ink-500">
                              {new Date(p.fechaVencimiento).toLocaleDateString("es")}
                            </span>
                            {(() => {
                              const v = estadoVencimiento(p.fechaVencimiento);
                              return v ? <Badge tone={v.tone}>{v.texto}</Badge> : null;
                            })()}
                          </div>
                        ) : (
                          <span className="text-[12px] text-ink-400">No vence</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono">
                        {p.stockDisponible}
                      </td>
                      <td className="px-5 py-3.5">
                        {out ? (
                          <Badge tone="red">Agotado</Badge>
                        ) : low ? (
                          <Badge tone="amber">Stock bajo</Badge>
                        ) : (
                          <Badge tone="moss">Disponible</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openStock(p)}
                        >
                          Stock
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(p)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-clay-600 hover:bg-clay-50"
                          onClick={() => setToDelete(p)}
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Crear / editar */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar producto" : "Nuevo producto"}
        subtitle={
          editing
            ? "Actualiza los datos del producto. El stock se ajusta desde la tabla."
            : "Registra un insumo, medicamento o material del inventario."
        }
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tipo"
              placeholder="Medicamento, insumo…"
              required
              maxLength={80}
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            />
            <Input
              label="Unidad"
              placeholder="ml, unidades, g…"
              required
              maxLength={40}
              value={form.unidadMedida}
              onChange={(e) =>
                setForm({ ...form, unidadMedida: e.target.value })
              }
            />
          </div>
          {!editing && (
            <Input
              label="Stock disponible"
              type="number"
              min="0"
              max="1000000"
              step="1"
              required
              value={form.stockDisponible || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  stockDisponible: parseInt(e.target.value) || 0,
                })
              }
            />
          )}

          <Input
            label="Vencimiento"
            hint="opcional"
            type="date"
            value={form.fechaVencimiento ?? ""}
            onChange={(e) =>
              setForm({ ...form, fechaVencimiento: e.target.value })
            }
          />
          <p className="text-[11px] text-ink-500 -mt-2">
            Dejalo vacío si el producto no vence (material, instrumental, etc.).
          </p>

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
                : "Crear producto"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ajustar stock */}
      <Modal
        open={!!stockTarget}
        onClose={() => setStockTarget(null)}
        title="Ajustar stock"
        subtitle={
          stockTarget
            ? `${stockTarget.nombre} · actual: ${stockTarget.stockDisponible} ${stockTarget.unidadMedida}`
            : undefined
        }
      >
        <form onSubmit={guardarStock} className="space-y-4">
          <Input
            label="Nuevo stock"
            hint={stockTarget?.unidadMedida}
            type="number"
            min="0"
            max="1000000"
            step="1"
            required
            autoFocus
            value={stockValue}
            onChange={(e) => setStockValue(e.target.value)}
          />

          {stockError && <ErrorBox message={stockError} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStockTarget(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={stockSaving}>
              {stockSaving ? "Guardando…" : "Actualizar stock"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Dar de baja producto"
        message={
          <>
            ¿Dar de baja el producto <strong>{toDelete?.nombre}</strong>? Dejará
            de aparecer en el inventario.
          </>
        }
        tone="danger"
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (toDelete) {
            const nombre = toDelete.nombre;
            await productosApi.remove(toDelete.id);
            toast.success(`Se dio de baja “${nombre}”.`);
            reload();
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
