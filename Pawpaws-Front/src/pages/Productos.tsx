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
import { productosApi } from "../api/endpoints";
import type { CrearProductoDto, Producto } from "../types";

const emptyForm: CrearProductoDto = {
  nombre: "",
  tipo: "",
  unidadMedida: "",
  stockDisponible: 0,
};

export function Productos() {
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
      if (editing) {
        // El stock se gestiona aparte; el PUT solo cambia datos descriptivos.
        await productosApi.update(editing.id, {
          nombre: form.nombre,
          tipo: form.tipo,
          unidadMedida: form.unidadMedida,
        });
      } else {
        await productosApi.create(form);
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
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tipo"
              placeholder="Medicamento, insumo…"
              required
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            />
            <Input
              label="Unidad"
              placeholder="ml, unidades, g…"
              required
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
            await productosApi.remove(toDelete.id);
            reload();
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
