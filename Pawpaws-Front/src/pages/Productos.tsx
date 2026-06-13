import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/Button";
import { Card, EmptyState, ErrorBox, Spinner } from "../components/Card";
import { Input } from "../components/Field";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { useFetch } from "../hooks/useFetch";
import { productosApi } from "../api/endpoints";
import type { CrearProductoDto } from "../types";

const emptyForm: CrearProductoDto = {
  nombre: "",
  tipo: "",
  unidadMedida: "",
  stockDisponible: 0,
};

export function Productos() {
  const { data, error, loading, reload } = useFetch(() => productosApi.list());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CrearProductoDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await productosApi.create(form);
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
        eyebrow="Inventario"
        title="Productos"
        description="Medicamentos, insumos y materiales disponibles. El stock se ajusta al usarse en consultas."
        actions={
          <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>
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
              <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo producto"
        subtitle="Registra un insumo, medicamento o material del inventario."
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
              {submitting ? "Guardando…" : "Crear producto"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
