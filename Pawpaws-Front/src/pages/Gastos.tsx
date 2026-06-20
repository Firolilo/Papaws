import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Wallet, Stethoscope, Pill, ClipboardList, FileDown, ChevronRight } from "lucide-react";
import { Button } from "../components/Button";
import { Card, ErrorBox, Spinner } from "../components/Card";
import { Badge, estadoTone } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { consultasApi, animalesApi } from "../api/endpoints";
import { descargarPdf, SeccionPdf } from "../utils/pdf";
import type { GastoConsulta } from "../types";

const fmt = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 0,
  useGrouping: false,
});

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function claveMes(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function etiquetaMes(clave: string): string {
  const [a, m] = clave.split("-");
  return `${MESES[Number(m) - 1]} ${a}`;
}

export function Gastos() {
  const gastos = useFetch(() => consultasApi.gastos());
  const animales = useFetch(() => animalesApi.list());

  const nombreAnimal = useMemo(() => {
    const map = new Map<string, string>();
    (animales.data ?? []).forEach((a) => map.set(a.id, a.nombre));
    return map;
  }, [animales.data]);

  // Las consultas canceladas no representan gasto real (productos devueltos, servicio no realizado).
  const reales = useMemo(
    () => (gastos.data ?? []).filter((g) => g.estado !== "Cancelada"),
    [gastos.data]
  );

  // Agrupación por mes (de lo más reciente a lo más antiguo).
  const porMes = useMemo(() => {
    const grupos = new Map<string, GastoConsulta[]>();
    reales.forEach((g) => {
      const k = claveMes(g.fechaHora);
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k)!.push(g);
    });
    return [...grupos.entries()]
      .map(([clave, items]) => ({
        clave,
        items: items.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()),
        total: items.reduce((s, g) => s + g.total, 0),
        servicios: items.reduce((s, g) => s + g.costoServicios, 0),
        productos: items.reduce((s, g) => s + g.costoProductos, 0),
      }))
      .sort((a, b) => b.clave.localeCompare(a.clave));
  }, [reales]);

  const totales = useMemo(() => ({
    total: reales.reduce((s, g) => s + g.total, 0),
    servicios: reales.reduce((s, g) => s + g.costoServicios, 0),
    productos: reales.reduce((s, g) => s + g.costoProductos, 0),
    consultas: reales.length,
  }), [reales]);

  // Datos del gráfico: últimos 6 meses con su total (cronológico ascendente).
  const chartData = useMemo(
    () => [...porMes].slice(0, 6).reverse().map((m) => ({ name: etiquetaMes(m.clave), total: m.total })),
    [porMes]
  );

  const [exportando, setExportando] = useState(false);
  async function exportarPdf() {
    setExportando(true);
    try {
      const secciones: SeccionPdf[] = [
        {
          titulo: "Resumen",
          tipo: "kpis",
          items: [
            { label: "Gasto total", valor: fmt.format(totales.total) },
            { label: "En servicios", valor: fmt.format(totales.servicios) },
            { label: "En productos", valor: fmt.format(totales.productos) },
            { label: "Consultas", valor: String(totales.consultas) },
          ],
        },
        ...porMes.map((m): SeccionPdf => ({
          titulo: `${etiquetaMes(m.clave)} — ${fmt.format(m.total)}`,
          tipo: "tabla",
          headers: ["Consulta", "Animal", "Servicios", "Productos", "Total"],
          filas: m.items.map((g) => [
            g.codigo,
            nombreAnimal.get(g.animalId) ?? "—",
            fmt.format(g.costoServicios),
            fmt.format(g.costoProductos),
            fmt.format(g.total),
          ]),
          total: ["Total del mes", "", fmt.format(m.servicios), fmt.format(m.productos), fmt.format(m.total)],
        })),
      ];
      await descargarPdf({
        tituloDoc: "Reporte de gastos",
        titulo: "Gastos por consulta",
        subtitulo: "Servicios y productos consumidos, agrupados por mes",
        secciones,
        nombreArchivo: "Reporte de gastos",
        pie: "Refugio sin fines de lucro — control de gastos.",
      });
    } finally {
      setExportando(false);
    }
  }

  if (gastos.loading) return <Spinner />;
  if (gastos.error) return <ErrorBox message={gastos.error} />;

  return (
    <>
      <PageHeader
        eyebrow="Finanzas"
        title="Gastos"
        description="En qué se va el dinero del refugio: servicios y productos usados en cada consulta, mes a mes."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<FileDown size={15} />}
            onClick={exportarPdf}
            disabled={exportando || porMes.length === 0}
          >
            {exportando ? "Generando…" : "Descargar PDF"}
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi icon={<Wallet size={18} />} label="Gasto total" value={fmt.format(totales.total)} />
        <Kpi icon={<Stethoscope size={18} />} label="En servicios" value={fmt.format(totales.servicios)} />
        <Kpi icon={<Pill size={18} />} label="En productos" value={fmt.format(totales.productos)} />
        <Kpi icon={<ClipboardList size={18} />} label="Consultas con gasto" value={String(totales.consultas)} />
      </div>

      {/* Gráfico mensual */}
      {chartData.length > 0 && (
        <Card className="p-6 mb-8">
          <h2 className="font-display text-2xl text-moss-800 mb-1">Gasto por mes</h2>
          <p className="text-xs text-ink-400 mb-3">Últimos 6 meses con actividad</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9f6f2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5a6068" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5a6068" }} axisLine={false} tickLine={false} width={70}
                tickFormatter={(v: any) => fmt.format(v)} />
              <Tooltip
                formatter={(v: any) => fmt.format(Number(v))}
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e0d3", fontSize: 13 }}
              />
              <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill="#0a9396" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Detalle mensual */}
      {porMes.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-clay-50 flex items-center justify-center mb-4">
            <Wallet size={24} className="text-clay-400" />
          </div>
          <p className="font-display text-xl text-moss-800">Sin gastos registrados</p>
          <p className="text-sm text-ink-500 mt-1.5">
            Cuando se realicen consultas con servicios o productos, los gastos aparecerán acá.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {porMes.map((m) => (
            <section key={m.clave}>
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="font-display text-2xl text-moss-800 capitalize">{etiquetaMes(m.clave)}</h2>
                <div className="text-right">
                  <p className="font-display text-2xl text-moss-800">{fmt.format(m.total)}</p>
                  <p className="text-[12px] text-ink-400">
                    {fmt.format(m.servicios)} servicios · {fmt.format(m.productos)} productos
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {m.items.map((g) => (
                  <Card key={g.codigo} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <Link
                          to={`/consultas/${encodeURIComponent(g.codigo)}`}
                          className="group inline-flex items-center gap-1.5 font-mono font-semibold text-moss-800 hover:text-moss-600"
                        >
                          {g.codigo}
                          <ChevronRight size={13} className="text-ink-500/30 group-hover:text-moss-600" />
                        </Link>
                        <p className="text-[12.5px] text-ink-500 mt-0.5">
                          {nombreAnimal.get(g.animalId) ?? "Animal"} ·{" "}
                          {new Date(g.fechaHora).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-lg text-moss-800">{fmt.format(g.total)}</p>
                        <Badge tone={estadoTone(g.estado)}>{g.estado}</Badge>
                      </div>
                    </div>

                    {(g.servicios.length > 0 || g.productos.length > 0) && (
                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 pt-2 border-t border-moss-100 text-[12.5px]">
                        {g.servicios.map((s, i) => (
                          <div key={`s${i}`} className="flex items-center justify-between gap-2">
                            <span className="text-ink-600 truncate">
                              <Stethoscope size={11} className="inline mr-1 text-moss-500" />
                              {s.nombre}
                            </span>
                            <span className="font-mono text-ink-500">{fmt.format(s.costo)}</span>
                          </div>
                        ))}
                        {g.productos.map((p, i) => (
                          <div key={`p${i}`} className="flex items-center justify-between gap-2">
                            <span className="text-ink-600 truncate">
                              <Pill size={11} className="inline mr-1 text-clay-500" />
                              {p.nombre} ×{p.cantidad}
                            </span>
                            <span className="font-mono text-ink-500">{fmt.format(p.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-moss-600 mb-2">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
      </div>
      <p className="font-display text-xl text-moss-800 leading-tight truncate">{value}</p>
    </Card>
  );
}
