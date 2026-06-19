import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";
import {
  BarChart2, ChevronDown, Database, Loader2, Search,
  RefreshCw, CheckCircle2, AlertCircle, X, ArrowLeft, ChevronRight, FileDown,
} from "lucide-react";
import { Card, ErrorBox, Spinner } from "../components/Card";
import { Badge, estadoTone } from "../components/Badge";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../auth/AuthContext";
import {
  animalesApi, consultasApi, rescatistasApi, veterinariosApi,
  productosApi, serviciosApi, organizacionesApi, reportesApi, seedApi,
} from "../api/endpoints";
import type { Animal, Consulta, Rescatista, Veterinario, Servicio, Producto, Organizacion } from "../types";
import { descargarPdf } from "../utils/pdf";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  moss700: "#005f73", moss500: "#0a9396", moss300: "#94d2bd",
  clay500: "#bb3e03", clay300: "#fc7c41",
  sun400: "#ee9b00",
  ink400: "#5a6068",
};
const SPECIES_PALETTE  = [C.moss700, C.clay500, C.sun400, C.moss500, C.moss300, C.clay300, "#9b2226", "#3f977a", "#ae2012", "#ca6702"];
const ESTADO_PALETTE: Record<string, string> = { Pendiente: C.sun400, Confirmada: C.moss500, Completada: C.moss700, Cancelada: C.clay500 };
const RESCATISTA_PAL   = [C.moss700, C.moss500, C.sun400, C.clay300, C.moss300, C.clay500, "#3f977a", "#9b2226"];
const VENCIMIENTO_PAL: Record<string, string> = { Vencido: C.clay500, "Por vencer": C.sun400, Vigente: C.moss500, "Sin vencimiento": C.ink400 };
const ANIMAL_ESTADO_LABEL: Record<string, string> = { Disponible: "Disponible", EnTratamiento: "En tratamiento", Adoptado: "Adoptado", Devuelto: "Devuelto" };
const ANIMAL_ESTADO_PAL: Record<string, string> = { Disponible: C.moss500, "En tratamiento": C.sun400, Adoptado: C.moss700, Devuelto: C.clay500 };

// ─── Overlay base ─────────────────────────────────────────────────────────────
function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 pb-8"
      style={{ background: "rgba(0,0,0,0.48)", backdropFilter: "blur(6px)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "80vh" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── SearchableSelect ─────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string; }

function SearchableSelect({ options, value, onChange, placeholder }: {
  options: SelectOption[]; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const selected          = options.find((o) => o.value === value);
  const filtered          = options.filter((o) => !query || o.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none z-10" />
        <input
          type="text"
          className="w-full rounded-xl border border-moss-200 pl-9 pr-8 py-2 text-sm text-moss-800 focus:outline-none focus:ring-2 focus:ring-moss-400 bg-white placeholder:text-ink-400"
          placeholder={open || !selected ? (placeholder ?? "Buscar…") : ""}
          value={open ? query : ""}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!open && selected && (
          <span className="absolute left-9 right-8 top-1/2 -translate-y-1/2 text-sm text-moss-800 truncate pointer-events-none">
            {selected.label}
          </span>
        )}
        {value ? (
          <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-clay-500 z-10"
            onMouseDown={(e) => { e.preventDefault(); onChange(""); setQuery(""); setOpen(false); }}>
            <X size={13} />
          </button>
        ) : (
          <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-white rounded-xl border border-moss-200 shadow-xl max-h-52 overflow-y-auto">
          {filtered.length === 0
            ? <p className="px-3 py-2.5 text-sm text-ink-400 italic">Sin resultados</p>
            : filtered.map((o) => (
              <button key={o.value} type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${o.value === value ? "bg-moss-50 text-moss-700 font-semibold" : "text-ink-700 hover:bg-moss-50"}`}>
                {o.label}
              </button>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type InputType = "none" | "rescatista" | "animal" | "veterinario" | "servicio"
  | "producto" | "codigo" | "texto" | "estado" | "fecha" | "zona" | "especie" | "especialidad" | "organizacion" | "tipoOrganizacion";

interface ReportCol { key: string; label: string; render?: (v: unknown, row: Record<string, unknown>) => React.ReactNode; }
interface ReportCfg {
  id: string; chebotko: string; label: string; desc: string; group: string;
  inputType: InputType; inputLabel?: string;
  fetch: (val: string) => Promise<unknown>;
  rows: (data: unknown) => unknown[];
  header?: (data: unknown) => { title: string; sub?: string } | null;
  cols: ReportCol[];
}

type OverlayKind =
  | { kind: "palette" }
  | { kind: "report"; reportId: string; initialVal?: string }
  | { kind: "chart"; title: string; sub?: string; cols: ReportCol[]; rowsFn: (d: unknown) => unknown[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (s: string | undefined) =>
  s ? new Date(s).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtTime = (s: string | undefined) =>
  s ? new Date(s).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) : "";
const shortId  = (id: unknown) => (typeof id === "string" && id.length > 8 ? `…${id.slice(-8)}` : String(id ?? "—"));
const paginaItems = (data: unknown): unknown[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.items)) return d.items;
  return [data];
};

// Muestra el nombre de una referencia (animal / veterinario) ya resuelto por el backend.
// Las referencias dadas de baja o eliminadas vienen marcadas y se resaltan en vez de quedar
// en blanco. Si el backend no mandó nombre (respuesta vieja), cae al ID corto.
function RefName({ value, id }: { value: unknown; id?: unknown }) {
  const nombre = typeof value === "string" ? value.trim() : "";
  if (!nombre) return <span className="font-mono text-xs text-ink-400">{shortId(id)}</span>;
  const huerfano = /\((dado de baja|eliminado)\)/i.test(nombre);
  return <span className={huerfano ? "text-clay-500 italic" : ""}>{nombre}</span>;
}

// ─── Shared column sets ───────────────────────────────────────────────────────
const ANIMAL_COLS: ReportCol[] = [
  { key: "idAnimal",    label: "ID",      render: (v) => <span className="font-mono text-xs text-ink-400">{shortId(v)}</span> },
  { key: "nombreAnimal",label: "Nombre" },
  { key: "especie",     label: "Especie", render: (v) => <Badge tone="moss">{String(v)}</Badge> },
  { key: "fechaIngreso",label: "Ingreso", render: (v) => fmtDate(String(v)) },
];
const CONSULTA_ESTADO_COLS: ReportCol[] = [
  { key: "estado",    label: "Estado",  render: (v) => <Badge tone={estadoTone(String(v))}>{String(v)}</Badge> },
  { key: "fechaCita", label: "Fecha",   render: (v) => `${fmtDate(String(v))} ${fmtTime(String(v))}` },
  { key: "codReserva",label: "Código",  render: (v) => <span className="font-mono text-sm">{String(v)}</span> },
  { key: "nombreAnimal", label: "Animal", render: (v, r) => <RefName value={v} id={(r as any).idAnimal} /> },
];
const PRODUCTO_COLS: ReportCol[] = [
  { key: "idProducto",     label: "ID",     render: (v) => <span className="font-mono text-xs text-ink-400">{shortId(v)}</span> },
  { key: "nombreProducto", label: "Nombre" },
  { key: "tipoProducto",   label: "Tipo" },
  { key: "unidadMedida",   label: "Unidad" },
  { key: "stockDisponible",label: "Stock" },
];

// ─── Reports config ───────────────────────────────────────────────────────────
const REPORTS: ReportCfg[] = [
  // RESCATISTAS
  { id:"c1",  chebotko:"C1",  label:"Rescatista por ID",          group:"Rescatistas", desc:"Información completa de un rescatista.", inputType:"rescatista", inputLabel:"Rescatista", fetch:(id)=>reportesApi.c1_rescatistaPorId(id), rows:(d)=>(d?[d]:[]), cols:[{key:"idRescatista",label:"ID",render:(v)=><span className="font-mono text-xs text-ink-400">{shortId(v)}</span>},{key:"nombreCompleto",label:"Nombre"},{key:"telefono",label:"Teléfono"},{key:"email",label:"Email"},{key:"organizacion",label:"Organización"},{key:"zonaOperacion",label:"Zona"}] },
  { id:"c2",  chebotko:"C2",  label:"Animales por rescatista",    group:"Rescatistas", desc:"Todos los animales ingresados por un rescatista.", inputType:"rescatista", inputLabel:"Rescatista", fetch:(id)=>reportesApi.c2_animalesPorRescatista(id), rows:(d:any)=>d?.animales??[], header:(d:any)=>d?{title:d.nombreRescatista,sub:`ID ${shortId(d.idRescatista)}`}:null, cols:ANIMAL_COLS },
  { id:"c19", chebotko:"C19", label:"Rescatistas por zona",       group:"Rescatistas", desc:"Todos los rescatistas activos en una zona.", inputType:"zona", inputLabel:"Zona", fetch:(zona)=>reportesApi.c19_rescatistasPorZona(zona), rows:paginaItems, cols:[{key:"idRescatista",label:"ID",render:(v)=><span className="font-mono text-xs text-ink-400">{shortId(v)}</span>},{key:"nombreCompleto",label:"Nombre"},{key:"telefono",label:"Teléfono"},{key:"zonaOperacion",label:"Zona"}] },
  { id:"c20", chebotko:"C20", label:"Organización → rescatistas → animales", group:"Rescatistas", desc:"Rescatistas de una organización y los animales de cada uno.", inputType:"organizacion", inputLabel:"Organización", fetch:(id)=>reportesApi.c20_organizacionDetalle(id), rows:(d:any)=>d?.filas??[], header:(d:any)=>d?{title:d.nombreOrganizacion,sub:`${d.tipo} · ${d.totalRescatistas} rescatista${d.totalRescatistas===1?"":"s"} · ${d.totalAnimales} animal${d.totalAnimales===1?"":"es"}`}:null, cols:[{key:"nombreRescatista",label:"Rescatista"},{key:"nombreAnimal",label:"Animal",render:(v)=>v?String(v):<span className="text-ink-400 italic">(sin animales)</span>},{key:"especie",label:"Especie",render:(v)=>v?<Badge tone="moss">{String(v)}</Badge>:<span className="text-ink-400">—</span>},{key:"fechaIngreso",label:"Ingreso",render:(v)=>v?fmtDate(String(v)):"—"}] },
  { id:"c21", chebotko:"C21", label:"Rescatistas por tipo de organización", group:"Rescatistas", desc:"Voluntarios agrupados según el tipo de organización al que pertenecen.", inputType:"tipoOrganizacion", inputLabel:"Tipo de organización", fetch:(t)=>reportesApi.c21_rescatistasPorTipoOrg(t), rows:paginaItems, cols:[{key:"nombreCompleto",label:"Rescatista"},{key:"organizacion",label:"Organización",render:(v)=><Badge tone="blue">{String(v)}</Badge>},{key:"zonaOperacion",label:"Zona"},{key:"email",label:"Email"}] },
  // ANIMALES
  { id:"c3",  chebotko:"C3",  label:"Animales por especie",       group:"Animales",    desc:"Todos los animales filtrados por especie.", inputType:"especie", inputLabel:"Especie", fetch:(esp)=>reportesApi.c3_animalesPorEspecie(esp), rows:paginaItems, cols:ANIMAL_COLS },
  { id:"c4",  chebotko:"C4",  label:"Consultas por animal",       group:"Animales",    desc:"Historial de consultas de un animal.", inputType:"animal", inputLabel:"Animal", fetch:(id)=>reportesApi.c4_consultasPorAnimal(id), rows:(d:any)=>d?.consultas??[], header:(d:any)=>d?{title:d.nombreAnimal,sub:d.especie}:null, cols:[{key:"fechaCita",label:"Fecha",render:(v)=>`${fmtDate(String(v))} ${fmtTime(String(v))}`},{key:"codConsulta",label:"Código",render:(v)=><span className="font-mono text-sm">{String(v)}</span>},{key:"estado",label:"Estado",render:(v)=><Badge tone={estadoTone(String(v))}>{String(v)}</Badge>},{key:"nombreVeterinario",label:"Veterinario",render:(v,r)=><RefName value={v} id={(r as any).idVeterinario} />},{key:"observaciones",label:"Observaciones"}] },
  { id:"c17", chebotko:"C17", label:"Animales por nombre",        group:"Animales",    desc:"Buscar animales por nombre (parcial).", inputType:"texto", inputLabel:"Nombre del animal", fetch:(n)=>reportesApi.c17_animalesPorNombre(n), rows:paginaItems, cols:ANIMAL_COLS },
  // CONSULTAS
  { id:"c15", chebotko:"C15", label:"Consulta por código",        group:"Consultas",   desc:"Datos de una consulta por su código.", inputType:"codigo", inputLabel:"Código de consulta", fetch:(c)=>reportesApi.c15_consultaPorCodigo(c), rows:(d)=>(d?[d]:[]), cols:[{key:"codConsulta",label:"Código",render:(v)=><span className="font-mono">{String(v)}</span>},{key:"fechaCita",label:"Fecha",render:(v)=>`${fmtDate(String(v))} ${fmtTime(String(v))}`},{key:"estado",label:"Estado",render:(v)=><Badge tone={estadoTone(String(v))}>{String(v)}</Badge>},{key:"nombreAnimal",label:"Animal",render:(v,r)=><RefName value={v} id={(r as any).idAnimal} />},{key:"nombreVeterinario",label:"Vet",render:(v,r)=><RefName value={v} id={(r as any).idVeterinario} />}] },
  { id:"c6",  chebotko:"C6",  label:"Detalle de consulta",        group:"Consultas",   desc:"Detalle completo incluyendo servicios y diagnóstico.", inputType:"codigo", inputLabel:"Código de consulta", fetch:(c)=>reportesApi.c6_detalleConsulta(c), rows:(d)=>(d?[d]:[]), cols:[{key:"codConsulta",label:"Código",render:(v)=><span className="font-mono">{String(v)}</span>},{key:"fechaCita",label:"Fecha",render:(v)=>`${fmtDate(String(v))} ${fmtTime(String(v))}`},{key:"estado",label:"Estado",render:(v)=><Badge tone={estadoTone(String(v))}>{String(v)}</Badge>},{key:"nombreAnimal",label:"Animal",render:(v,r)=><RefName value={v} id={(r as any).idAnimal} />},{key:"nombreVeterinario",label:"Veterinario",render:(v,r)=><RefName value={v} id={(r as any).idVeterinario} />},{key:"observaciones",label:"Observaciones"},{key:"diagnostico",label:"Diagnóstico"}] },
  { id:"c7",  chebotko:"C7",  label:"Consultas por estado",       group:"Consultas",   desc:"Todas las consultas filtradas por estado.", inputType:"estado", inputLabel:"Estado", fetch:(e)=>reportesApi.c7_consultasPorEstado(e), rows:paginaItems, cols:CONSULTA_ESTADO_COLS },
  { id:"c8",  chebotko:"C8",  label:"Servicios por consulta",     group:"Consultas",   desc:"Todos los servicios de una consulta.", inputType:"codigo", inputLabel:"Código de consulta", fetch:(c)=>reportesApi.c8_serviciosPorConsulta(c), rows:(d)=>(Array.isArray(d)?d:[]), cols:[{key:"nombreServicio",label:"Servicio"},{key:"duracionEstimadaMinutos",label:"Duración (min)"},{key:"precioBase",label:"Costo",render:(v)=>`$${Number(v).toLocaleString("es")}`}] },
  { id:"c9",  chebotko:"C9",  label:"Productos por consulta",     group:"Consultas",   desc:"Todos los productos usados en una consulta.", inputType:"codigo", inputLabel:"Código de consulta", fetch:(c)=>reportesApi.c9_productosPorConsulta(c), rows:(d)=>(Array.isArray(d)?d:[]), cols:[{key:"nombreProducto",label:"Producto"},{key:"cantidadUsada",label:"Cantidad"},{key:"idProducto",label:"ID",render:(v)=><span className="font-mono text-xs text-ink-400">{shortId(v)}</span>}] },
  { id:"c16", chebotko:"C16", label:"Consultas por fecha",        group:"Consultas",   desc:"Consultas programadas en una fecha.", inputType:"fecha", inputLabel:"Fecha", fetch:(f)=>reportesApi.c16_consultasPorFecha(f), rows:paginaItems, cols:[{key:"fechaCita",label:"Hora",render:(v)=>fmtTime(String(v))},{key:"codConsulta",label:"Código",render:(v)=><span className="font-mono text-sm">{String(v)}</span>},{key:"estado",label:"Estado",render:(v)=><Badge tone={estadoTone(String(v))}>{String(v)}</Badge>},{key:"nombreAnimal",label:"Animal",render:(v,r)=><RefName value={v} id={(r as any).idAnimal} />},{key:"nombreVeterinario",label:"Vet",render:(v,r)=><RefName value={v} id={(r as any).idVeterinario} />}] },
  // VETERINARIOS
  { id:"c12", chebotko:"C12", label:"Veterinario por ID",         group:"Veterinarios",desc:"Información de un veterinario.", inputType:"veterinario", inputLabel:"Veterinario", fetch:(id)=>reportesApi.c12_veterinarioPorId(id), rows:(d)=>(d?[d]:[]), cols:[{key:"idVeterinario",label:"ID",render:(v)=><span className="font-mono text-xs text-ink-400">{shortId(v)}</span>},{key:"nombreCompleto",label:"Nombre"},{key:"telefonoContacto",label:"Teléfono"},{key:"especialidadPrincipal",label:"Especialidad",render:(v)=><Badge tone="sun">{String(v)}</Badge>}] },
  { id:"c5",  chebotko:"C5",  label:"Consultas por veterinario",  group:"Veterinarios",desc:"Historial de consultas de un veterinario.", inputType:"veterinario", inputLabel:"Veterinario", fetch:(id)=>reportesApi.c5_consultasPorVeterinario(id), rows:(d:any)=>d?.consultas??[], header:(d:any)=>d?{title:d.nombreVeterinario}:null, cols:[{key:"fechaCita",label:"Fecha",render:(v)=>`${fmtDate(String(v))} ${fmtTime(String(v))}`},{key:"codConsulta",label:"Código",render:(v)=><span className="font-mono text-sm">{String(v)}</span>},{key:"estado",label:"Estado",render:(v)=><Badge tone={estadoTone(String(v))}>{String(v)}</Badge>},{key:"observaciones",label:"Obs"}] },
  { id:"c13", chebotko:"C13", label:"Veterinarios por especialidad",group:"Veterinarios",desc:"Veterinarios filtrados por especialidad.", inputType:"especialidad", inputLabel:"Especialidad", fetch:(e)=>reportesApi.c13_veterinariosPorEsp(e), rows:paginaItems, cols:[{key:"idVeterinario",label:"ID",render:(v)=><span className="font-mono text-xs text-ink-400">{shortId(v)}</span>},{key:"nombreCompleto",label:"Nombre"},{key:"telefonoContacto",label:"Teléfono"},{key:"especialidad",label:"Especialidad",render:(v)=><Badge tone="sun">{String(v)}</Badge>}] },
  // SERVICIOS
  { id:"c11", chebotko:"C11", label:"Servicio por ID",            group:"Servicios",   desc:"Información de un servicio.", inputType:"servicio", inputLabel:"Servicio", fetch:(id)=>reportesApi.c11_servicioPorId(id), rows:(d)=>(d?[d]:[]), cols:[{key:"idServicio",label:"ID",render:(v)=><span className="font-mono text-xs text-ink-400">{shortId(v)}</span>},{key:"nombre",label:"Nombre"},{key:"descripcion",label:"Descripción"},{key:"duracionEstimadaMinutos",label:"Duración (min)"},{key:"precioBase",label:"Precio",render:(v)=>`$${Number(v).toLocaleString("es")}`}] },
  // PRODUCTOS
  { id:"c10", chebotko:"C10", label:"Inventario por stock",       group:"Productos",   desc:"Inventario ordenado por stock ascendente.", inputType:"none", fetch:()=>reportesApi.c10_productosPorStock(), rows:paginaItems, cols:[{key:"nombreProducto",label:"Producto"},{key:"tipoProducto",label:"Tipo"},{key:"stockDisponible",label:"Stock",render:(v)=><span className={`font-bold ${Number(v)<=5?"text-clay-500":Number(v)<=15?"text-sun-400":"text-moss-700"}`}>{String(v)}</span>},{key:"unidadMedida",label:"Unidad"}] },
  { id:"c14", chebotko:"C14", label:"Producto por ID",            group:"Productos",   desc:"Información de un producto.", inputType:"producto", inputLabel:"Producto", fetch:(id)=>reportesApi.c14_productoPorId(id), rows:(d)=>(d?[d]:[]), cols:PRODUCTO_COLS },
];

const GROUPS = ["Rescatistas", "Animales", "Consultas", "Veterinarios", "Servicios", "Productos"];
// Reportes que solo consultan los servicios de Animales/Rescatistas (LecturaGlobal): visibles
// para todos los roles. El resto llama al servicio de Consulta y requiere acceso a consultas.
const REPORTES_TODOS_LOS_ROLES = ["c1", "c2", "c19", "c20", "c21", "c3", "c17"];
const ESTADOS = ["Pendiente", "Confirmada", "Completada", "Cancelada"];
const ESPECIE_OPTIONS:      SelectOption[] = ["Perro","Gato","Conejo","Ave","Loro","Tortuga","Hámster","Iguana","Gecko","Serpiente","Chinchilla"].map(e=>({value:e,label:e}));
const ZONA_OPTIONS:         SelectOption[] = ["Norte","Sur","Este","Oeste","Centro"].map(z=>({value:z,label:z}));
const ESPECIALIDAD_OPTIONS: SelectOption[] = ["Medicina General","Cirugía","Dermatología","Odontología","Exóticos","Nutrición"].map(e=>({value:e,label:e}));
const TIPO_ORG_OPTIONS:     SelectOption[] = ["ONG","Autoridad ambiental","Refugio","Independiente"].map(t=>({value:t,label:t}));

const AUTO_RUN_TYPES: InputType[] = ["rescatista","animal","veterinario","servicio","producto","estado","especie","especialidad","zona","organizacion","tipoOrganizacion"];

// ─── Exportar reporte a PDF ───────────────────────────────────────────────────
/** Valor de texto plano de una celda para el PDF: formatea fechas ISO, deja el resto como texto. */
function celdaPdf(col: ReportCol, row: Record<string, unknown>): string {
  const v = row[col.key];
  if (v == null || v === "") return "—";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    const d = new Date(v);
    const conHora = /por fecha|consulta/i.test(col.label);
    return conHora
      ? d.toLocaleString("es", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
  }
  return String(v);
}

// Columnas numéricas que se totalizan en el PDF, con su etiqueta de KPI y formato.
const COLS_TOTALIZABLES: Record<string, { kpi: string; fmt: (n: number) => string }> = {
  precioBase:                { kpi: "Costo total",     fmt: (n) => `$${n.toLocaleString("es")}` },
  costo:                     { kpi: "Costo total",     fmt: (n) => `$${n.toLocaleString("es")}` },
  stockDisponible:           { kpi: "Stock total",     fmt: (n) => n.toLocaleString("es") },
  cantidadUsada:             { kpi: "Cantidad total",  fmt: (n) => n.toLocaleString("es") },
  duracionEstimadaMinutos:   { kpi: "Duración total",  fmt: (n) => `${n.toLocaleString("es")} min` },
};

function exportarReportePdf(
  titulo: string,
  chebotko: string,
  descripcion: string,
  subtitulo: string | null,
  cols: ReportCol[],
  rows: unknown[]
): Promise<void> {
  // Sumas por columna numérica presente en este reporte.
  const sumas = new Map<string, number>();
  for (const c of cols) {
    if (!(c.key in COLS_TOTALIZABLES)) continue;
    let suma = 0, hay = false;
    for (const r of rows) {
      const v = (r as Record<string, unknown>)[c.key];
      const n = typeof v === "number" ? v : parseFloat(String(v));
      if (!isNaN(n)) { suma += n; hay = true; }
    }
    if (hay) sumas.set(c.key, suma);
  }

  // Banda de KPIs: cantidad de registros + cada total numérico.
  const kpis = [
    { label: "Registros", valor: String(rows.length) },
    ...cols
      .filter((c) => sumas.has(c.key))
      .map((c) => ({ label: COLS_TOTALIZABLES[c.key].kpi, valor: COLS_TOTALIZABLES[c.key].fmt(sumas.get(c.key)!) })),
  ];

  // Fila de totales alineada bajo las columnas numéricas.
  const total = sumas.size > 0
    ? cols.map((c, i) =>
        sumas.has(c.key) ? COLS_TOTALIZABLES[c.key].fmt(sumas.get(c.key)!) : i === 0 ? "Total" : "")
    : undefined;

  return descargarPdf({
    tituloDoc: `Reporte ${chebotko}`,
    titulo,
    subtitulo: descripcion,
    etiqueta: subtitulo ?? undefined,
    secciones: [
      { titulo: "Resumen", tipo: "kpis", items: kpis },
      {
        titulo: `Resultados (${rows.length} registro${rows.length === 1 ? "" : "s"})`,
        tipo: "tabla",
        headers: cols.map((c) => c.label),
        filas: rows.map((r) => cols.map((c) => celdaPdf(c, r as Record<string, unknown>))),
        vacio: "Sin resultados.",
        total,
      },
    ],
    nombreArchivo: `Reporte ${chebotko} - ${titulo}`,
  });
}

// ─── Mini table (shared in overlays) ─────────────────────────────────────────
function MiniTable({ cols, rows }: { cols: ReportCol[]; rows: unknown[] }) {
  if (rows.length === 0) return <p className="text-center py-8 font-hand text-xl text-clay-400">sin resultados ♡</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-moss-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-moss-50">
            {cols.map((c) => <th key={c.key} className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider text-ink-400 font-bold">{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-moss-50">
          {rows.map((row, i) => {
            const r = row as Record<string, unknown>;
            return (
              <tr key={i} className="hover:bg-bone-100 transition-colors">
                {cols.map((c) => (
                  <td key={c.key} className="px-4 py-2.5 text-moss-800">
                    {c.render ? c.render(r[c.key], r) : r[c.key] != null ? String(r[c.key]) : <span className="text-ink-400">—</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-ink-400 text-right border-t border-moss-50">{rows.length} resultado{rows.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-moss-100 px-3 py-2 text-sm pointer-events-none">
      {label && <p className="font-semibold text-moss-800 mb-0.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill ?? C.moss700 }} className="font-medium">{p.value}</p>
      ))}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export function Reportes() {
  const { puedeAccederConsultas } = useAuth();

  // Reportes visibles según rol: sin acceso a consultas, solo los de animales/rescatistas.
  const visibleReports = useMemo(
    () =>
      puedeAccederConsultas
        ? REPORTS
        : REPORTS.filter((r) => REPORTES_TODOS_LOS_ROLES.includes(r.id)),
    [puedeAccederConsultas]
  );

  const animales    = useFetch(() => animalesApi.list());
  const consultas   = useFetch(() => (puedeAccederConsultas ? consultasApi.list()     : Promise.resolve([])), [puedeAccederConsultas]);
  const rescatistas = useFetch(() => rescatistasApi.list());
  const vets        = useFetch(() => (puedeAccederConsultas ? veterinariosApi.list()  : Promise.resolve([])), [puedeAccederConsultas]);
  const productos   = useFetch(() => (puedeAccederConsultas ? productosApi.list()     : Promise.resolve([])), [puedeAccederConsultas]);

  // Seed
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Entity lists for pickers
  const [rescatistasList, setRescatistasList] = useState<Rescatista[]>([]);
  const [animalesList,    setAnimalesList]     = useState<Animal[]>([]);
  const [vetsList,        setVetsList]         = useState<Veterinario[]>([]);
  const [serviciosList,   setServiciosList]    = useState<Servicio[]>([]);
  const [productosList,   setProductosList]    = useState<Producto[]>([]);
  const [organizacionesList, setOrganizacionesList] = useState<Organizacion[]>([]);

  useEffect(() => { rescatistasApi.list().then(setRescatistasList).catch(() => {}); }, []);
  useEffect(() => { animalesApi.list().then(setAnimalesList).catch(() => {}); }, []);
  useEffect(() => { organizacionesApi.list().then(setOrganizacionesList).catch(() => {}); }, []);
  useEffect(() => {
    if (!puedeAccederConsultas) return;
    veterinariosApi.list().then(setVetsList).catch(() => {});
    productosApi.list().then(setProductosList).catch(() => {});
    serviciosApi.list().then(setServiciosList).catch(() => {});
  }, [puedeAccederConsultas]);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const especiePieData = useMemo(() => {
    const cnt: Record<string, number> = {};
    (animales.data ?? []).forEach((a) => (cnt[a.especie] = (cnt[a.especie] ?? 0) + 1));
    return Object.entries(cnt).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [animales.data]);

  // Consultas vigentes: se ocultan las huérfanas (su animal ya no existe).
  const consultasVigentes = useMemo(() => {
    const cs = consultas.data ?? [];
    if (!animales.data) return cs;
    const ids = new Set(animales.data.map((a) => a.id));
    return cs.filter((c) => ids.has(c.animalId));
  }, [consultas.data, animales.data]);

  const estadoBarData = useMemo(() =>
    ESTADOS.map((e) => ({ name: e, value: consultasVigentes.filter((c) => c.estado === e).length })),
  [consultasVigentes]);

  const rescatistaBarData = useMemo(() => {
    const rMap = new Map((rescatistas.data ?? []).map((r) => [r.id, r]));
    const cnt: Record<string, { id: string; nombre: string; nombreCompleto: string; animales: number }> = {};
    (animales.data ?? []).forEach((a) => {
      const r = rMap.get(a.rescatistaId);
      if (!cnt[a.rescatistaId]) cnt[a.rescatistaId] = { id: a.rescatistaId, nombre: r?.nombreCompleto.split(" ")[0] ?? "?", nombreCompleto: r?.nombreCompleto ?? a.rescatistaId, animales: 0 };
      cnt[a.rescatistaId].animales++;
    });
    return Object.values(cnt).sort((a, b) => b.animales - a.animales).slice(0, 8);
  }, [animales.data, rescatistas.data]);

  const stockBarData = useMemo(() =>
    [...(productos.data ?? [])]
      .sort((a, b) => a.stockDisponible - b.stockDisponible)
      .slice(0, 8)
      .map((p) => ({
        id: p.id, name: p.nombre.split(" ")[0], fullName: p.nombre,
        stock: p.stockDisponible,
        fill: p.stockDisponible <= 5 ? C.clay500 : p.stockDisponible <= 15 ? C.sun400 : C.moss500,
      })),
  [productos.data]);

  // Animales por estado (Disponible / En tratamiento / Adoptado / Devuelto).
  const animalEstadoPieData = useMemo(() => {
    const cnt: Record<string, number> = {};
    (animales.data ?? []).forEach((a) => (cnt[a.estado] = (cnt[a.estado] ?? 0) + 1));
    const orden = ["Disponible", "EnTratamiento", "Adoptado", "Devuelto"];
    return orden
      .filter((e) => cnt[e])
      .map((e) => ({ name: ANIMAL_ESTADO_LABEL[e] ?? e, value: cnt[e] }));
  }, [animales.data]);

  // Consultas por mes (últimos 6 meses), para ver la tendencia de actividad clínica.
  const consultasPorMesData = useMemo(() => {
    const meses: { clave: string; name: string }[] = [];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      meses.push({
        clave: `${d.getFullYear()}-${d.getMonth()}`,
        name: d.toLocaleDateString("es", { month: "short" }),
      });
    }
    const cnt: Record<string, number> = {};
    consultasVigentes.forEach((c) => {
      const d = new Date(c.fechaHora);
      cnt[`${d.getFullYear()}-${d.getMonth()}`] = (cnt[`${d.getFullYear()}-${d.getMonth()}`] ?? 0) + 1;
    });
    return meses.map((m) => ({ name: m.name, value: cnt[m.clave] ?? 0 }));
  }, [consultasVigentes]);

  // Vencimiento de productos: vigente / por vencer (≤30 días) / vencido / sin vencimiento.
  const vencimientoPieData = useMemo(() => {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + 30);
    const cnt: Record<string, number> = {};
    (productos.data ?? []).forEach((p) => {
      let cat: string;
      if (!p.fechaVencimiento) cat = "Sin vencimiento";
      else {
        const f = new Date(p.fechaVencimiento);
        cat = f < hoy ? "Vencido" : f <= limite ? "Por vencer" : "Vigente";
      }
      cnt[cat] = (cnt[cat] ?? 0) + 1;
    });
    const orden = ["Vencido", "Por vencer", "Vigente", "Sin vencimiento"];
    return orden
      .filter((name) => cnt[name])
      .map((name) => ({ name, value: cnt[name] }));
  }, [productos.data]);

  // Organizaciones por tipo (cuántas hay de cada tipo).
  const orgTipoPieData = useMemo(() => {
    const cnt: Record<string, number> = {};
    organizacionesList.forEach((o) => (cnt[o.tipo] = (cnt[o.tipo] ?? 0) + 1));
    return Object.entries(cnt).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [organizacionesList]);

  // Rescatistas por organización (top 8).
  const orgRescatistasBarData = useMemo(() => {
    const nombrePorId = new Map(organizacionesList.map((o) => [o.id, o.nombre]));
    const cnt: Record<string, number> = {};
    rescatistasList.forEach((r) => {
      if (!r.organizacionId) return;
      cnt[r.organizacionId] = (cnt[r.organizacionId] ?? 0) + 1;
    });
    return Object.entries(cnt)
      .map(([id, value]) => ({
        name: (nombrePorId.get(id) ?? "?").split(" ")[0],
        fullName: nombrePorId.get(id) ?? "?",
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [organizacionesList, rescatistasList]);

  // ── Overlay state ────────────────────────────────────────────────────────────
  const [overlay,      setOverlay]      = useState<OverlayKind | null>(null);
  const [paletteQuery, setPaletteQuery] = useState("");

  // Report overlay
  const [oReportVal,     setOReportVal]     = useState("");
  const [oReportData,    setOReportData]    = useState<unknown>(null);
  const [oReportLoading, setOReportLoading] = useState(false);
  const [oReportError,   setOReportError]   = useState<string | null>(null);

  // Chart overlay
  const [oChartData,    setOChartData]    = useState<unknown>(null);
  const [oChartLoading, setOChartLoading] = useState(false);
  const [oChartError,   setOChartError]   = useState<string | null>(null);

  const runOReport = useCallback(async (report: ReportCfg, val: string) => {
    setOReportLoading(true); setOReportError(null);
    try   { setOReportData(await report.fetch(val)); }
    catch (e: unknown) { setOReportError(e instanceof Error ? e.message : "Error inesperado"); }
    finally { setOReportLoading(false); }
  }, []);

  // Auto-run when report overlay opens
  useEffect(() => {
    if (overlay?.kind !== "report") return;
    const report = REPORTS.find((r) => r.id === overlay.reportId);
    if (!report) return;
    setOReportData(null); setOReportError(null);
    const val = overlay.initialVal ?? "";
    setOReportVal(val);
    if (report.inputType === "none" || val) runOReport(report, val);
  }, [overlay, runOReport]);

  const openReport = useCallback((reportId: string, initialVal?: string) => {
    setOverlay({ kind: "report", reportId, initialVal });
  }, []);

  const openChartOverlay = useCallback(async (args: { title: string; sub?: string; cols: ReportCol[]; rowsFn: (d: unknown) => unknown[]; fetchFn: () => Promise<unknown> }) => {
    setOverlay({ kind: "chart", title: args.title, sub: args.sub, cols: args.cols, rowsFn: args.rowsFn });
    setOChartData(null); setOChartError(null); setOChartLoading(true);
    try   { setOChartData(await args.fetchFn()); }
    catch (e: unknown) { setOChartError(e instanceof Error ? e.message : "Error"); }
    finally { setOChartLoading(false); }
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlay(null); setPaletteQuery(""); setOReportVal(""); setOReportData(null);
    setOReportError(null); setOChartData(null); setOChartError(null);
  }, []);

  // ── Chart click handlers ─────────────────────────────────────────────────────
  const handlePieClick = (entry: any) => {
    const p = entry?.payload ?? entry;
    const esp = String(p?.name ?? "");
    if (!esp) return;
    openChartOverlay({
      title: `${esp}s en el refugio`,
      sub: `${p.value} animal${p.value !== 1 ? "es" : ""} de esta especie`,
      cols: ANIMAL_COLS,
      rowsFn: paginaItems,
      fetchFn: () => reportesApi.c3_animalesPorEspecie(esp),
    });
  };

  const handleEstadoBarClick = (data: any) => {
    const p = data?.payload ?? data;
    const estado = p?.name;
    if (!estado) return;
    const cnt = p.value;
    openChartOverlay({
      title: `Consultas ${estado}s`,
      sub: `${cnt} consulta${cnt !== 1 ? "s" : ""} en este estado`,
      cols: CONSULTA_ESTADO_COLS,
      rowsFn: paginaItems,
      fetchFn: () => reportesApi.c7_consultasPorEstado(estado),
    });
  };

  const handleRescatistaBarClick = (data: any) => {
    const entry = data?.payload ?? data;
    if (!entry?.id) return;
    openChartOverlay({
      title: `Animales de ${entry.nombreCompleto}`,
      sub: `${entry.animales} animal${entry.animales !== 1 ? "es" : ""} rescatado${entry.animales !== 1 ? "s" : ""}`,
      cols: ANIMAL_COLS,
      rowsFn: (d: any) => d?.animales ?? [],
      fetchFn: () => reportesApi.c2_animalesPorRescatista(entry.id),
    });
  };

  const handleProductoBarClick = (data: any) => {
    const entry = data?.payload ?? data;
    if (!entry?.id) return;
    openChartOverlay({
      title: entry.fullName,
      sub: `Stock actual: ${entry.stock} unidades`,
      cols: PRODUCTO_COLS,
      rowsFn: (d) => (d ? [d] : []),
      fetchFn: () => reportesApi.c14_productoPorId(entry.id),
    });
  };

  // ── Seed ─────────────────────────────────────────────────────────────────────
  const handleSeed = async () => {
    setSeeding(true); setSeedMsg(null);
    try {
      const r1 = await seedApi.animales();
      const r2 = await seedApi.consulta(r1.animalIds ?? []);
      setSeedMsg({ ok: true, text: [r1.mensaje, r2.mensaje].join(" | ") });
      animales.reload?.(); consultas.reload?.(); rescatistas.reload?.(); vets.reload?.(); productos.reload?.();
    } catch (e: unknown) {
      setSeedMsg({ ok: false, text: e instanceof Error ? e.message : "Error" });
    } finally { setSeeding(false); }
  };

  // ── Palette filter ───────────────────────────────────────────────────────────
  const filteredPaletteReports = useMemo(() => {
    const q = paletteQuery.toLowerCase().trim();
    if (!q) return visibleReports;
    return visibleReports.filter((r) => r.label.toLowerCase().includes(q) || r.chebotko.toLowerCase().includes(q) || r.group.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
  }, [paletteQuery, visibleReports]);

  // ── Current overlay report ───────────────────────────────────────────────────
  const oReport = overlay?.kind === "report" ? REPORTS.find((r) => r.id === overlay.reportId) ?? null : null;
  const oRows   = oReport && oReportData ? oReport.rows(oReportData) : [];
  const oHeader = oReport?.header?.(oReportData) ?? null;

  const oInputOpts = (): SelectOption[] => {
    if (!oReport) return [];
    switch (oReport.inputType) {
      case "organizacion": return organizacionesList.map((o) => ({ value: o.id, label: `${o.nombre} · ${o.tipo}` }));
      case "tipoOrganizacion": return TIPO_ORG_OPTIONS;
      case "rescatista":   return rescatistasList.map((r) => ({ value: r.id, label: `${r.nombreCompleto} · ${r.zonaOperacion}` }));
      case "animal":       return animalesList.map((a) => ({ value: a.id, label: `${a.nombre} (${a.especie})` }));
      case "veterinario":  return vetsList.map((v) => ({ value: v.id, label: `${v.nombreCompleto} · ${v.especialidadPrincipal}` }));
      case "servicio":     return serviciosList.map((s) => ({ value: s.id, label: s.nombre }));
      case "producto":     return productosList.map((p) => ({ value: p.id, label: `${p.nombre} (${p.tipo})` }));
      case "estado":       return ESTADOS.map((e) => ({ value: e, label: e }));
      case "especie":      return ESPECIE_OPTIONS;
      case "zona":         return ZONA_OPTIONS;
      case "especialidad": return ESPECIALIDAD_OPTIONS;
      default:             return [];
    }
  };

  const handleOSelectChange = (val: string) => {
    setOReportVal(val);
    if (val && oReport && AUTO_RUN_TYPES.includes(oReport.inputType)) runOReport(oReport, val);
  };

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* BANNER */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-moss-700 to-moss-800 text-white p-8 sm:p-10 mb-8 paw-confetti">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-hand text-3xl text-clay-300 leading-none">análisis y datos</p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl leading-tight mt-2">
              Reportes <span className="text-clay-200">& estadísticas</span>
            </h1>
            <p className="mt-3 text-clay-50 text-[15px] font-medium">Visualizá el estado del refugio y generá reportes detallados.</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button onClick={handleSeed} disabled={seeding}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white ring-1 ring-white/30 font-semibold rounded-full px-5 py-2.5 text-sm transition-colors disabled:opacity-60">
              {seeding ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />}
              {seeding ? "Sembrando…" : "Sembrar datos demo"}
            </button>
            {seedMsg && (
              <div className={`flex items-start gap-2 text-sm max-w-sm rounded-xl px-3 py-2 ${seedMsg.ok ? "bg-moss-600 text-white" : "bg-clay-600 text-white"}`}>
                {seedMsg.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
                <span>{seedMsg.text}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Animales",     val: animales.data?.length    ?? "…", color: "bg-moss-50 text-moss-700" },
          { label: "Rescatistas",  val: rescatistas.data ? rescatistas.data.filter((r) => !r.oculto).length : "…", color: "bg-clay-50 text-clay-500" },
          ...(puedeAccederConsultas ? [
            { label: "Consultas",    val: consultas.data ? consultasVigentes.length : "…", color: "bg-sun-300 text-ink-700" },
            { label: "Veterinarios", val: vets.data?.length       ?? "…", color: "bg-moss-100 text-moss-800" },
            { label: "Productos",    val: productos.data?.length  ?? "…", color: "bg-bone-100 text-ink-500" },
          ] : []),
        ].map((s) => (
          <div key={s.label} className={`rounded-xl2 p-4 ${s.color}`}>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">{s.label}</p>
            <p className="font-display text-4xl mt-1">{s.val}</p>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
        {/* Pie: especie */}
        <Card className="p-6">
          <p className="font-hand text-xl text-clay-500 leading-none">distribución</p>
          <h2 className="font-display text-2xl text-moss-800 mb-1">Animales por especie</h2>
          <p className="text-xs text-ink-400 mb-3">Tocá un segmento para ver todos los animales de esa especie</p>
          {animales.loading ? <Spinner /> : especiePieData.length === 0
            ? <p className="text-center text-ink-400 py-10 font-hand text-xl">sin datos aún ♡</p>
            : (
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie data={especiePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value"
                    onClick={handlePieClick} cursor="pointer"
                    label={({ percent }: { percent?: number }) => (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""}
                    labelLine={false}>
                    {especiePieData.map((_, i) => <Cell key={i} fill={SPECIES_PALETTE[i % SPECIES_PALETTE.length]} stroke="white" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" iconSize={9} formatter={(v) => <span className="text-[12px] text-ink-500">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </Card>

        {/* Pie: animales por estado */}
        <Card className="p-6">
          <p className="font-hand text-xl text-clay-500 leading-none">población</p>
          <h2 className="font-display text-2xl text-moss-800 mb-1">Animales por estado</h2>
          <p className="text-xs text-ink-400 mb-3">Cómo se reparte la población actual del refugio</p>
          {animales.loading ? <Spinner /> : animalEstadoPieData.length === 0
            ? <p className="text-center text-ink-400 py-10 font-hand text-xl">sin datos aún ♡</p>
            : (
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie data={animalEstadoPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={92} paddingAngle={3} dataKey="value"
                    label={({ name, value }: any) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 12 }}>
                    {animalEstadoPieData.map((e, i) => <Cell key={i} fill={ANIMAL_ESTADO_PAL[e.name] ?? SPECIES_PALETTE[i % SPECIES_PALETTE.length]} stroke="white" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </Card>

        {/* Bar: consultas por mes */}
        {puedeAccederConsultas && (
          <Card className="p-6">
            <p className="font-hand text-xl text-clay-500 leading-none">tendencia</p>
            <h2 className="font-display text-2xl text-moss-800 mb-1">Consultas por mes</h2>
            <p className="text-xs text-ink-400 mb-3">Actividad clínica de los últimos 6 meses</p>
            {consultas.loading ? <Spinner /> : (
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={consultasPorMesData} barSize={34}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9f6f2" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5a6068" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#5a6068" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(0,95,115,0.05)", radius: 8 }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} fill={C.moss500}>
                    <LabelList dataKey="value" position="top" style={{ fontSize: 12, fill: "#5a6068", fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        )}

        {/* Bar: estado */}
        {puedeAccederConsultas && (
          <Card className="p-6">
            <p className="font-hand text-xl text-clay-500 leading-none">agenda</p>
            <h2 className="font-display text-2xl text-moss-800 mb-1">Consultas por estado</h2>
            <p className="text-xs text-ink-400 mb-3">Tocá una barra para ver todas las consultas de ese estado</p>
            {consultas.loading ? <Spinner /> : (
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={estadoBarData} barSize={52}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9f6f2" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5a6068" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#5a6068" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(0,95,115,0.05)", radius: 8 }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} cursor="pointer" onClick={handleEstadoBarClick}>
                    {estadoBarData.map((e) => <Cell key={e.name} fill={ESTADO_PALETTE[e.name] ?? C.ink400} />)}
                    <LabelList dataKey="value" position="top" style={{ fontSize: 12, fill: "#5a6068", fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        )}

        {/* Bar: rescatistas */}
        <Card className="p-6">
          <p className="font-hand text-xl text-clay-500 leading-none">equipo</p>
          <h2 className="font-display text-2xl text-moss-800 mb-1">Animales por rescatista</h2>
          <p className="text-xs text-ink-400 mb-3">Tocá una barra para ver todos los animales de esa persona</p>
          {animales.loading || rescatistas.loading ? <Spinner /> : rescatistaBarData.length === 0
            ? <p className="text-center text-ink-400 py-10 font-hand text-xl">sin datos aún ♡</p>
            : (
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={rescatistaBarData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9f6f2" vertical={false} />
                  <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: "#5a6068" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#5a6068" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(0,95,115,0.05)", radius: 8 }} />
                  <Bar dataKey="animales" radius={[10, 10, 0, 0]} cursor="pointer" onClick={handleRescatistaBarClick}>
                    {rescatistaBarData.map((_, i) => <Cell key={i} fill={RESCATISTA_PAL[i % RESCATISTA_PAL.length]} />)}
                    <LabelList dataKey="animales" position="top" style={{ fontSize: 12, fill: "#5a6068", fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
        </Card>

        {/* Horizontal bar: stock */}
        {puedeAccederConsultas && (
          <Card className="p-6">
            <p className="font-hand text-xl text-clay-500 leading-none">inventario</p>
            <h2 className="font-display text-2xl text-moss-800 mb-1">Stock de productos</h2>
            <p className="text-xs text-ink-400 mb-3">
              Tocá una barra para ver el detalle · <span className="text-clay-500 font-semibold">Rojo</span> crítico · <span className="text-sun-400 font-semibold">Naranja</span> bajo
            </p>
            {productos.loading ? <Spinner /> : stockBarData.length === 0
              ? <p className="text-center text-ink-400 py-10 font-hand text-xl">sin datos aún ♡</p>
              : (
                <ResponsiveContainer width="100%" height={270}>
                  <BarChart layout="vertical" data={stockBarData} margin={{ left: 0, right: 32 }} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9f6f2" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#5a6068" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={76} tick={{ fontSize: 12, fill: "#5a6068" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(0,95,115,0.05)" }} />
                    <Bar dataKey="stock" radius={[0, 8, 8, 0]} cursor="pointer" onClick={handleProductoBarClick}>
                      {stockBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      <LabelList dataKey="stock" position="right" style={{ fontSize: 11, fill: "#5a6068", fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
          </Card>
        )}

        {/* Pie: vencimiento de productos */}
        {puedeAccederConsultas && (
          <Card className="p-6">
            <p className="font-hand text-xl text-clay-500 leading-none">inventario</p>
            <h2 className="font-display text-2xl text-moss-800 mb-1">Vencimiento de productos</h2>
            <p className="text-xs text-ink-400 mb-3">
              <span className="text-clay-500 font-semibold">Vencido</span> · <span className="text-sun-400 font-semibold">Por vencer</span> (≤30 días) · <span className="text-moss-500 font-semibold">Vigente</span>
            </p>
            {productos.loading ? <Spinner /> : vencimientoPieData.length === 0
              ? <p className="text-center text-ink-400 py-10 font-hand text-xl">sin datos aún ♡</p>
              : (
                <ResponsiveContainer width="100%" height={270}>
                  <PieChart>
                    <Pie data={vencimientoPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={92} paddingAngle={3} dataKey="value"
                      label={({ name, value }: any) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 12 }}>
                      {vencimientoPieData.map((e, i) => <Cell key={i} fill={VENCIMIENTO_PAL[e.name] ?? C.ink400} stroke="white" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
          </Card>
        )}

        {/* Pie: organizaciones por tipo */}
        <Card className="p-6">
          <p className="font-hand text-xl text-clay-500 leading-none">red de rescate</p>
          <h2 className="font-display text-2xl text-moss-800 mb-1">Organizaciones por tipo</h2>
          <p className="text-xs text-ink-400 mb-3">Cuántas organizaciones hay de cada tipo</p>
          {orgTipoPieData.length === 0
            ? <p className="text-center text-ink-400 py-10 font-hand text-xl">sin datos aún ♡</p>
            : (
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie data={orgTipoPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={92} paddingAngle={3} dataKey="value"
                    label={({ name, value }: any) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 12 }}>
                    {orgTipoPieData.map((_, i) => <Cell key={i} fill={RESCATISTA_PAL[i % RESCATISTA_PAL.length]} stroke="white" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </Card>

        {/* Bar: rescatistas por organización */}
        <Card className="p-6">
          <p className="font-hand text-xl text-clay-500 leading-none">red de rescate</p>
          <h2 className="font-display text-2xl text-moss-800 mb-1">Rescatistas por organización</h2>
          <p className="text-xs text-ink-400 mb-3">Cuántos rescatistas pertenecen a cada organización</p>
          {orgRescatistasBarData.length === 0
            ? <p className="text-center text-ink-400 py-10 font-hand text-xl">sin datos aún ♡</p>
            : (
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={orgRescatistasBarData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9f6f2" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5a6068" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#5a6068" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(0,95,115,0.05)", radius: 8 }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {orgRescatistasBarData.map((_, i) => <Cell key={i} fill={RESCATISTA_PAL[i % RESCATISTA_PAL.length]} />)}
                    <LabelList dataKey="value" position="top" style={{ fontSize: 12, fill: "#5a6068", fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
        </Card>
      </div>

      {/* REPORT LAUNCHER */}
      <div className="mb-4 flex items-center gap-3">
        <BarChart2 size={22} className="text-moss-700" />
        <div>
          <h2 className="font-display text-2xl text-moss-800">Generador de reportes</h2>
          <p className="text-xs text-ink-400">{visibleReports.length} reportes disponibles — buscá por nombre, categoría o código</p>
        </div>
      </div>

      <button
        onClick={() => { setPaletteQuery(""); setOverlay({ kind: "palette" }); }}
        className="w-full bg-white border-2 border-dashed border-moss-200 rounded-2xl px-6 py-8 text-center hover:border-moss-400 hover:bg-moss-50 transition-all group"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-moss-50 group-hover:bg-moss-100 flex items-center justify-center transition-colors">
            <Search size={20} className="text-moss-500" />
          </div>
          <p className="font-display text-xl text-moss-700 group-hover:text-moss-800">Buscar y generar reporte…</p>
        </div>
        <p className="text-sm text-ink-400 mb-4">Buscá por nombre, categoría (Animales, Consultas…) o código (C1, C7…)</p>
        <div className="flex flex-wrap justify-center gap-2">
          {GROUPS.map((g) => (
            <span key={g} className="text-xs bg-moss-50 text-moss-700 px-3 py-1 rounded-full border border-moss-200 group-hover:bg-white">
              {g}
            </span>
          ))}
        </div>
      </button>

      {/* ── OVERLAYS ──────────────────────────────────────────────────────────── */}
      {overlay && (
        <Overlay onClose={closeOverlay}>

          {/* PALETTE */}
          {overlay.kind === "palette" && (
            <>
              <div className="px-5 pt-5 pb-3 border-b border-moss-100">
                <div className="relative flex items-center">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar reporte por nombre, grupo o código…"
                    value={paletteQuery}
                    onChange={(e) => setPaletteQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-moss-200 focus:outline-none focus:ring-2 focus:ring-moss-400 text-moss-800 placeholder:text-ink-400"
                  />
                  {paletteQuery
                    ? <button onClick={() => setPaletteQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-clay-500"><X size={14} /></button>
                    : <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-400 font-mono bg-moss-50 px-1.5 py-0.5 rounded border border-moss-200">ESC</span>
                  }
                </div>
                <p className="text-xs text-ink-400 mt-2">{filteredPaletteReports.length} de {visibleReports.length} reportes</p>
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredPaletteReports.length === 0 ? (
                  <p className="text-center py-12 font-hand text-xl text-clay-400">sin resultados ♡</p>
                ) : paletteQuery.trim() ? (
                  <div className="p-3 space-y-1">
                    {filteredPaletteReports.map((r) => (
                      <button key={r.id} onClick={() => openReport(r.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-moss-50 transition-colors text-left group">
                        <span className="font-mono text-[10px] font-bold bg-moss-100 text-moss-700 px-2 py-0.5 rounded shrink-0">{r.chebotko}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-moss-800">{r.label}</p>
                          <p className="text-xs text-ink-400 truncate">{r.desc}</p>
                        </div>
                        <ChevronRight size={14} className="ml-auto text-ink-400 shrink-0 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                ) : (
                  GROUPS.map((group) => {
                    const items = visibleReports.filter((r) => r.group === group);
                    if (items.length === 0) return null;
                    return (
                      <div key={group}>
                        <p className="px-5 pt-4 pb-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-ink-400">{group}</p>
                        {items.map((r) => (
                          <button key={r.id} onClick={() => openReport(r.id)}
                            className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-moss-50 transition-colors text-left group">
                            <span className="font-mono text-[10px] font-bold bg-moss-50 text-moss-700 px-2 py-0.5 rounded shrink-0">{r.chebotko}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-moss-800">{r.label}</p>
                              <p className="text-xs text-ink-400 truncate">{r.desc}</p>
                            </div>
                            <ChevronRight size={14} className="ml-auto text-ink-400 shrink-0 opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* REPORT DETAIL */}
          {overlay.kind === "report" && oReport && (
            <>
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b border-moss-100 flex items-center gap-3">
                <button onClick={() => { setPaletteQuery(""); setOverlay({ kind: "palette" }); }}
                  className="shrink-0 w-8 h-8 rounded-lg hover:bg-moss-50 flex items-center justify-center text-ink-400 hover:text-moss-700 transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <span className="font-mono text-xs font-bold bg-moss-50 text-moss-700 px-2 py-0.5 rounded">{oReport.chebotko}</span>
                <div className="min-w-0">
                  <p className="font-display text-lg text-moss-800 leading-tight">{oReport.label}</p>
                  <p className="text-xs text-ink-400 truncate">{oReport.desc}</p>
                </div>
                {oRows.length > 0 && (
                  <button
                    onClick={() =>
                      exportarReportePdf(
                        oReport.label,
                        oReport.chebotko,
                        oReport.desc,
                        oHeader ? [oHeader.title, oHeader.sub].filter(Boolean).join(" · ") : null,
                        oReport.cols,
                        oRows
                      ).catch(() => {})
                    }
                    className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-xs font-semibold text-moss-700 hover:bg-moss-50 transition-colors"
                  >
                    <FileDown size={14} /> PDF
                  </button>
                )}
                <button onClick={closeOverlay} className={`${oRows.length > 0 ? "" : "ml-auto"} shrink-0 w-8 h-8 rounded-lg hover:bg-moss-50 flex items-center justify-center text-ink-400 hover:text-clay-500 transition-colors`}>
                  <X size={16} />
                </button>
              </div>

              {/* Input */}
              {oReport.inputType !== "none" && (
                <div className="px-5 py-3 border-b border-moss-100 flex gap-2">
                  {AUTO_RUN_TYPES.includes(oReport.inputType) ? (
                    <div className="flex-1">
                      <SearchableSelect options={oInputOpts()} value={oReportVal} onChange={handleOSelectChange}
                        placeholder={`Buscar ${oReport.inputLabel?.toLowerCase() ?? ""}…`} />
                    </div>
                  ) : oReport.inputType === "fecha" ? (
                    <input type="date" className="flex-1 rounded-xl border border-moss-200 px-3 py-2 text-sm text-moss-800 focus:outline-none focus:ring-2 focus:ring-moss-400"
                      value={oReportVal} onChange={(e) => { setOReportVal(e.target.value); if (e.target.value.length === 10) runOReport(oReport, e.target.value); }} />
                  ) : (
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                      <input type="text" placeholder={oReport.inputLabel ?? "Filtro…"}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-moss-200 text-moss-800 focus:outline-none focus:ring-2 focus:ring-moss-400"
                        value={oReportVal} onChange={(e) => setOReportVal(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && oReportVal.trim() && runOReport(oReport, oReportVal.trim())} />
                    </div>
                  )}
                  {!AUTO_RUN_TYPES.includes(oReport.inputType) && oReport.inputType !== "fecha" && (
                    <button onClick={() => oReportVal.trim() && runOReport(oReport, oReportVal.trim())}
                      disabled={!oReportVal || oReportLoading}
                      className="inline-flex items-center gap-2 bg-moss-700 text-white font-semibold rounded-xl px-4 py-2 text-sm hover:bg-moss-800 disabled:opacity-50 transition-colors">
                      {oReportLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      Generar
                    </button>
                  )}
                </div>
              )}

              {/* Results */}
              <div className="flex-1 overflow-y-auto p-5">
                {oReportLoading && <Spinner />}
                {oReportError && <ErrorBox message={oReportError} />}
                {!oReportLoading && !oReportError && (
                  <>
                    {oHeader && (
                      <div className="mb-3 p-3 rounded-xl bg-moss-50">
                        <p className="font-semibold text-moss-800">{oHeader.title}</p>
                        {oHeader.sub && <p className="text-xs text-ink-400">{oHeader.sub}</p>}
                      </div>
                    )}
                    {oRows.length > 0
                      ? <MiniTable cols={oReport.cols} rows={oRows} />
                      : oReportData !== null && <p className="text-center py-10 font-hand text-xl text-clay-400">sin resultados para este filtro ♡</p>
                    }
                    {oReportData === null && oReport.inputType !== "none" && (
                      <div className="text-center py-12 text-ink-400">
                        <Search size={32} className="mx-auto mb-3 text-moss-200" />
                        <p className="text-sm">Seleccioná o escribí un valor para generar el reporte</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* CHART DETAIL */}
          {overlay.kind === "chart" && (
            <>
              <div className="px-5 pt-4 pb-3 border-b border-moss-100 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-moss-800">{overlay.title}</p>
                  {overlay.sub && <p className="text-xs text-ink-400">{overlay.sub}</p>}
                </div>
                <button onClick={closeOverlay} className="shrink-0 w-8 h-8 rounded-lg hover:bg-moss-50 flex items-center justify-center text-ink-400 hover:text-clay-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {oChartLoading && <Spinner />}
                {oChartError && <ErrorBox message={oChartError} />}
                {!oChartLoading && !oChartError && oChartData !== null && (
                  <MiniTable cols={overlay.cols} rows={overlay.rowsFn(oChartData)} />
                )}
              </div>
            </>
          )}
        </Overlay>
      )}
    </div>
  );
}
