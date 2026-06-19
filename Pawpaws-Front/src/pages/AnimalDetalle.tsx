import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  CalendarHeart,
  ChevronRight,
  ClipboardList,
  FileDown,
  Heart,
  HeartHandshake,
  PawPrint,
  Scale,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { Button } from "../components/Button";
import { Card, ErrorBox, Spinner } from "../components/Card";
import { Badge, estadoTone, Tone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { Combobox } from "../components/Combobox";
import { Input, Textarea } from "../components/Field";
import { PageHeader } from "../components/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { descargarPdf, type SeccionPdf } from "../utils/pdf";
import {
  animalesApi,
  consultasApi,
  rescatistasApi,
  veterinariosApi,
} from "../api/endpoints";
import type { Consulta } from "../types";

const ESTADO_ANIMAL_TONE: Record<string, Tone> = {
  Disponible: "blue",
  EnTratamiento: "sun",
  Adoptado: "moss",
  Devuelto: "clay",
};

const ESTADO_ANIMAL_LABEL: Record<string, string> = {
  Disponible: "Disponible",
  EnTratamiento: "En tratamiento",
  Adoptado: "Adoptado",
  Devuelto: "Devuelto",
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnimalDetalle() {
  const { id = "" } = useParams();
  const { puedeAccederConsultas, puedeGestionarAnimales } = useAuth();
  const toast = useToast();

  const animal = useFetch(() => animalesApi.get(id), [id]);
  const rescatistas = useFetch(() => rescatistasApi.list());
  const adopciones = useFetch(() => animalesApi.adopciones(id), [id]);
  const custodia = useFetch(() => animalesApi.custodia(id), [id]);

  // Modal de estado/adopción.
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [estadoForm, setEstadoForm] = useState({
    estado: "Disponible",
    fechaSalida: "",
    adoptanteRescatistaId: "",
    nota: "",
  });
  const [estadoSaving, setEstadoSaving] = useState(false);
  const [estadoError, setEstadoError] = useState<string | null>(null);
  // El historial clínico vive en el servicio de Consulta: solo lo cargamos si el rol
  // tiene acceso (un EncargadoRescatistas ve la ficha pero no las consultas).
  const consultas = useFetch(
    () =>
      puedeAccederConsultas
        ? consultasApi.porAnimal(id)
        : Promise.resolve([] as Consulta[]),
    [id, puedeAccederConsultas]
  );
  const veterinarios = useFetch(
    () => (puedeAccederConsultas ? veterinariosApi.list() : Promise.resolve([])),
    [puedeAccederConsultas]
  );

  // El rescatista de ingreso se resuelve por id (no por el listado): así seguimos viendo sus
  // datos aunque haya sido dado de baja. El endpoint por-id devuelve también los inactivos.
  const rescatistaIngreso = useFetch(
    () =>
      animal.data
        ? rescatistasApi.get(animal.data.rescatistaId)
        : Promise.resolve(null),
    [animal.data?.rescatistaId]
  );
  const rescatista = rescatistaIngreso.data;

  const adoptante = useMemo(
    () =>
      animal.data?.adoptanteRescatistaId
        ? (rescatistas.data ?? []).find(
            (r) => r.id === animal.data!.adoptanteRescatistaId
          )
        : undefined,
    [rescatistas.data, animal.data]
  );

  const rescatistaOptions = useMemo(
    () =>
      (rescatistas.data ?? [])
        .filter((r) => !r.oculto)
        .map((r) => ({
          value: r.id,
          label: r.nombreCompleto,
          hint: r.organizacion,
        })),
    [rescatistas.data]
  );

  const nombreRescatista = useMemo(() => {
    const map = new Map((rescatistas.data ?? []).map((r) => [r.id, r.nombreCompleto]));
    return (rid?: string | null) => (rid ? map.get(rid) ?? "rescatista" : "—");
  }, [rescatistas.data]);

  // Historial de adopciones ordenado de lo más reciente a lo más antiguo.
  const historialAdopciones = useMemo(
    () =>
      [...(adopciones.data ?? [])].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    [adopciones.data]
  );

  // Historial de custodia (ingreso + reasignaciones entre rescatistas).
  const historialCustodia = useMemo(
    () =>
      [...(custodia.data ?? [])].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    [custodia.data]
  );

  const vetsById = useMemo(
    () => Object.fromEntries((veterinarios.data ?? []).map((v) => [v.id, v])),
    [veterinarios.data]
  );

  // Historia clínica ordenada de la más reciente a la más antigua.
  const historia = useMemo(
    () =>
      [...(consultas.data ?? [])].sort(
        (a, b) =>
          new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
      ),
    [consultas.data]
  );

  // Evolución de peso: cada consulta con peso registrado, en orden cronológico ascendente.
  const evolucionPeso = useMemo(
    () =>
      [...(consultas.data ?? [])]
        .filter((c) => c.peso != null)
        .sort(
          (a, b) =>
            new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
        )
        .map((c) => ({
          fecha: new Date(c.fechaHora).toLocaleDateString("es", {
            day: "2-digit",
            month: "short",
          }),
          peso: Number(c.peso),
        })),
    [consultas.data]
  );

  const stats = useMemo(() => {
    const total = historia.length;
    const completadas = historia.filter((c) => c.estado === "Completada").length;
    const ultima = historia.find((c) => c.estado === "Completada") ?? historia[0];
    const proxima = [...historia]
      .reverse()
      .find(
        (c) =>
          (c.estado === "Pendiente" || c.estado === "Confirmada") &&
          new Date(c.fechaHora).getTime() >= Date.now()
      );
    return { total, completadas, ultima, proxima };
  }, [historia]);

  function abrirEstado() {
    if (!animal.data) return;
    // Si está adoptado, el cambio natural es devolverlo; si no, dejar el estado actual.
    const inicial =
      animal.data.estado === "Adoptado" ? "Devuelto" : animal.data.estado || "Disponible";
    setEstadoForm({
      estado: inicial,
      fechaSalida: new Date().toISOString().slice(0, 10),
      adoptanteRescatistaId: animal.data.adoptanteRescatistaId ?? "",
      nota: "",
    });
    setEstadoError(null);
    setEstadoOpen(true);
  }

  async function guardarEstado(e: React.FormEvent) {
    e.preventDefault();
    if (estadoForm.estado === "Adoptado" && !estadoForm.adoptanteRescatistaId) {
      setEstadoError("Indicá qué rescatista se llevó al animal.");
      return;
    }
    const conFecha =
      estadoForm.estado === "Adoptado" || estadoForm.estado === "Devuelto";
    setEstadoSaving(true);
    setEstadoError(null);
    try {
      await animalesApi.cambiarEstado(id, {
        estado: estadoForm.estado,
        fechaSalida: conFecha
          ? new Date(estadoForm.fechaSalida).toISOString()
          : null,
        adoptanteRescatistaId:
          estadoForm.estado === "Adoptado"
            ? estadoForm.adoptanteRescatistaId
            : null,
        nota: estadoForm.estado === "Devuelto" ? estadoForm.nota || null : null,
      });
      toast.success(
        estadoForm.estado === "Adoptado"
          ? `${animal.data?.nombre} fue marcado como adoptado.`
          : estadoForm.estado === "Devuelto"
          ? `${animal.data?.nombre} fue devuelto al refugio. Registrá una consulta para revisarlo.`
          : `Estado actualizado a ${ESTADO_ANIMAL_LABEL[estadoForm.estado] ?? estadoForm.estado}.`
      );
      setEstadoOpen(false);
      animal.reload();
      adopciones.reload();
    } catch (err: any) {
      setEstadoError(err.message);
    } finally {
      setEstadoSaving(false);
    }
  }

  // Opciones de estado según el estado actual: solo se puede "Devolver" lo adoptado.
  const estadoOptions = useMemo(() => {
    const base = [
      { value: "Disponible", label: "Disponible" },
      { value: "EnTratamiento", label: "En tratamiento" },
    ];
    if (animal.data?.estado === "Adoptado") {
      return [
        { value: "Devuelto", label: "Devuelto al refugio" },
        ...base,
      ];
    }
    return [...base, { value: "Adoptado", label: "Adoptado" }];
  }, [animal.data?.estado]);

  // Genera la guía completa del animal y la descarga como PDF (nombre: "<animal> - historial.pdf").
  const [exportando, setExportando] = useState(false);
  async function exportarFicha() {
    const a = animal.data;
    if (!a) return;

    const secciones: SeccionPdf[] = [
      {
        titulo: "Datos del paciente",
        tipo: "datos",
        datos: [
          ["Especie", a.especie],
          ["Peso actual", `${Number(a.pesoActual).toFixed(2)} kg`],
          ["Fecha de ingreso", formatFecha(a.fechaIngreso)],
          [
            "Rescatista de ingreso",
            rescatista
              ? rescatista.nombreCompleto + (rescatista.activo ? "" : " (dado de baja)")
              : "—",
          ],
          ["Organización", rescatista?.organizacion ?? ""],
          ["Estado actual", ESTADO_ANIMAL_LABEL[a.estado] ?? a.estado],
        ],
      },
      {
        titulo: "Adopciones y devoluciones",
        tipo: "tabla",
        headers: ["Evento", "Fecha", "Detalle"],
        vacio: "Sin movimientos de adopción.",
        filas: historialAdopciones.map((ev) => [
          ev.tipo === "Devuelto" ? "Devuelto" : "Adoptado",
          formatFecha(ev.fecha),
          ev.tipo === "Adoptado"
            ? "Entregado por " + nombreRescatista(ev.rescatistaId)
            : ev.nota ?? "Devuelto al refugio",
        ]),
      },
      {
        titulo: "Evolución de peso",
        tipo: "texto",
        texto: evolucionPeso.length
          ? evolucionPeso.map((p) => `${p.fecha}: ${p.peso} kg`).join("      ·      ")
          : "Sin mediciones de peso registradas.",
      },
      {
        titulo: `Historia clínica (${historia.length})`,
        tipo: "tabla",
        headers: ["Fecha", "Veterinario", "Diagnóstico / tratamiento", "Signos"],
        vacio: "Sin consultas registradas.",
        filas: historia.map((c) => {
          const vet = vetsById[c.veterinarioId];
          const clinico = [
            c.diagnostico ? `Dx: ${c.diagnostico}` : "",
            c.tratamiento ? `Tx: ${c.tratamiento}` : "",
            c.indicacionesSeguimiento ? `Seguimiento: ${c.indicacionesSeguimiento}` : "",
            !c.diagnostico && c.observaciones ? c.observaciones : "",
          ]
            .filter(Boolean)
            .join("\n");
          const signos = [
            c.peso != null ? `Peso: ${c.peso} kg` : "",
            c.temperatura != null ? `Temp: ${c.temperatura} °C` : "",
            c.condicionCorporal ? `Cond.: ${c.condicionCorporal}` : "",
            c.ameritaTratamiento != null
              ? c.ameritaTratamiento
                ? "Amerita tratamiento"
                : "No amerita tratamiento"
              : "",
            c.proximoControl ? `Próx. control: ${formatFecha(c.proximoControl)}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          return [
            `${formatFecha(c.fechaHora)}\n${c.estado}`,
            vet?.nombreCompleto ?? "Veterinario",
            clinico || "—",
            signos || "—",
          ];
        }),
      },
    ];

    setExportando(true);
    try {
      await descargarPdf({
        tituloDoc: "Guía clínica del animal",
        titulo: a.nombre,
        subtitulo: `${a.especie} · ingresó el ${formatFecha(a.fechaIngreso)}`,
        etiqueta: ESTADO_ANIMAL_LABEL[a.estado] ?? a.estado,
        secciones,
        nombreArchivo: `${a.nombre} - historial`,
        pie: "Historial del animal desde su ingreso al refugio.",
      });
    } catch {
      toast.error("No se pudo generar el PDF.");
    } finally {
      setExportando(false);
    }
  }

  if (animal.loading) return <Spinner />;
  if (animal.error) return <ErrorBox message={animal.error} />;
  if (!animal.data) return <ErrorBox message="Animal no encontrado." />;

  const a = animal.data;

  return (
    <>
      <Link
        to="/animales"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-moss-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Volver a animales
      </Link>

      <PageHeader
        eyebrow="Ficha del paciente"
        title={a.nombre}
        description={`${a.especie} · ingresó el ${formatFecha(a.fechaIngreso)}`}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge tone={ESTADO_ANIMAL_TONE[a.estado] ?? "neutral"}>
              {ESTADO_ANIMAL_LABEL[a.estado] ?? a.estado}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileDown size={15} />}
              onClick={exportarFicha}
              disabled={exportando}
            >
              {exportando ? "Generando…" : "Descargar PDF"}
            </Button>
            {puedeGestionarAnimales && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Heart size={15} />}
                onClick={abrirEstado}
              >
                Cambiar estado
              </Button>
            )}
          </div>
        }
      />

      {/* Resumen del paciente */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Scale size={18} />}
          label="Peso actual"
          value={`${Number(a.pesoActual).toFixed(2)} kg`}
        />
        <StatCard
          icon={<HeartHandshake size={18} />}
          label="Rescatista de ingreso"
          value={
            rescatista
              ? rescatista.nombreCompleto +
                (rescatista.activo ? "" : " (dado de baja)")
              : "—"
          }
          hint={rescatista?.organizacion}
        />
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Consultas"
          value={
            puedeAccederConsultas ? String(stats.total) : "—"
          }
          hint={
            puedeAccederConsultas
              ? `${stats.completadas} completada${stats.completadas === 1 ? "" : "s"}`
              : undefined
          }
        />
        <StatCard
          icon={<CalendarHeart size={18} />}
          label="Próxima visita"
          value={
            !puedeAccederConsultas
              ? "—"
              : stats.proxima
              ? formatFecha(stats.proxima.fechaHora)
              : "Sin agendar"
          }
          hint={
            puedeAccederConsultas && stats.proxima
              ? formatHora(stats.proxima.fechaHora)
              : undefined
          }
        />
      </div>

      {/* Estado actual de adopción (banner) */}
      {a.estado === "Adoptado" && (
        <Card className="p-5 mb-6 border-moss-300 bg-moss-50/40">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={16} className="text-moss-700" />
            <h2 className="font-display text-lg text-moss-800">Adoptado</h2>
          </div>
          <p className="text-sm text-ink-700">
            {a.nombre} fue entregado el{" "}
            <strong>{a.fechaSalida ? formatFecha(a.fechaSalida) : "—"}</strong>
            {adoptante ? (
              <>
                {" "}por el rescatista <strong>{adoptante.nombreCompleto}</strong>.
              </>
            ) : (
              "."
            )}{" "}
            Su historial clínico completo queda disponible para entregar a la familia.
          </p>
        </Card>
      )}
      {a.estado === "Devuelto" && (
        <Card className="p-5 mb-6 border-clay-300 bg-clay-50/50">
          <div className="flex items-center gap-2 mb-1">
            <HeartHandshake size={16} className="text-clay-600" />
            <h2 className="font-display text-lg text-clay-600">
              Devuelto al refugio
            </h2>
          </div>
          <p className="text-sm text-ink-700">
            {a.nombre} volvió al refugio. Conviene agendar una consulta para
            revisar en qué condiciones está.
          </p>
        </Card>
      )}

      {/* Historial de adopciones */}
      {historialAdopciones.length > 0 && (
        <Card className="p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-moss-700" />
            <h2 className="font-display text-lg text-moss-800">
              Historial de adopciones
            </h2>
          </div>
          <ol className="space-y-2.5">
            {historialAdopciones.map((ev, i) => (
              <li key={i} className="flex items-start gap-3">
                <Badge tone={ev.tipo === "Devuelto" ? "clay" : "moss"}>
                  {ev.tipo === "Devuelto" ? "Devuelto" : "Adoptado"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-ink-700">
                    {formatFecha(ev.fecha)}
                    {ev.tipo === "Adoptado" ? (
                      <> · por {nombreRescatista(ev.rescatistaId)}</>
                    ) : (
                      <> · devuelto al refugio</>
                    )}
                  </p>
                  {ev.nota && (
                    <p className="text-[12.5px] text-ink-500 mt-0.5 leading-relaxed">
                      {ev.nota}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Historial de custodia */}
      {historialCustodia.length > 0 && (
        <Card className="p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <HeartHandshake size={16} className="text-moss-700" />
            <h2 className="font-display text-lg text-moss-800">
              Historial de custodia
            </h2>
          </div>
          <ol className="space-y-2.5">
            {historialCustodia.map((ev, i) => (
              <li key={i} className="flex items-start gap-3">
                <Badge tone={ev.tipo === "Reasignacion" ? "sun" : "moss"}>
                  {ev.tipo === "Reasignacion" ? "Reasignado" : "Ingreso"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-ink-700">
                    {formatFecha(ev.fecha)} ·{" "}
                    {ev.tipo === "Reasignacion" && ev.rescatistaAnterior ? (
                      <>
                        de <strong>{ev.rescatistaAnterior}</strong> a{" "}
                        <strong>{ev.rescatistaNuevo}</strong>
                      </>
                    ) : (
                      <>
                        ingresado por <strong>{ev.rescatistaNuevo}</strong>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Evolución de peso */}
      {puedeAccederConsultas && evolucionPeso.length > 0 && (
        <Card className="p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-moss-700" />
            <h2 className="font-display text-xl text-moss-800">
              Evolución de peso
            </h2>
            <span className="text-[12px] text-ink-500">
              {evolucionPeso.length} medición
              {evolucionPeso.length === 1 ? "" : "es"}
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucionPeso} margin={{ top: 5, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d3" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 12, fill: "#5a6068" }} tickLine={false} axisLine={{ stroke: "#e7e0d3" }} />
                <YAxis tick={{ fontSize: 12, fill: "#5a6068" }} tickLine={false} axisLine={false} width={40} unit=" kg" />
                <Tooltip
                  formatter={(v: any) => [`${v} kg`, "Peso"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #94d2bd", fontSize: 13 }}
                />
                <Line type="monotone" dataKey="peso" stroke="#0a9396" strokeWidth={2.5} dot={{ r: 4, fill: "#005f73" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Historia clínica */}
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope size={18} className="text-moss-700" />
        <h2 className="font-display text-2xl text-moss-800">Historia clínica</h2>
      </div>

      {!puedeAccederConsultas ? (
        <Card className="px-6 py-8">
          <p className="text-sm text-ink-500 leading-relaxed">
            Tu rol no tiene acceso al módulo de consultas, por eso no se muestra
            el historial clínico de este animal. Solicitá acceso a un encargado
            de consultas para verlo.
          </p>
        </Card>
      ) : consultas.loading ? (
        <Spinner />
      ) : consultas.error ? (
        <ErrorBox message={consultas.error} />
      ) : historia.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-clay-50 flex items-center justify-center mb-4">
            <PawPrint size={24} className="text-clay-400" />
          </div>
          <p className="font-display text-xl text-moss-800">
            Sin consultas todavía
          </p>
          <p className="text-sm text-ink-500 mt-1.5">
            Cuando agendes una consulta para {a.nombre}, su evolución aparecerá
            aquí como línea de tiempo.
          </p>
        </Card>
      ) : (
        <ol className="relative border-l-2 border-moss-100 ml-3 space-y-4">
          {historia.map((c) => {
            const vet = vetsById[c.veterinarioId];
            return (
              <li key={c.codigo} className="ml-6">
                {/* Punto en la línea de tiempo */}
                <span className="absolute -left-[9px] mt-1.5 w-4 h-4 rounded-full bg-white border-2 border-moss-400" />
                <Link
                  to={`/consultas/${encodeURIComponent(c.codigo)}`}
                  className="group block"
                >
                  <Card className="p-4 hover:border-moss-400 transition-colors">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge tone={estadoTone(c.estado)}>{c.estado}</Badge>
                      <span className="text-[13px] font-semibold text-moss-800">
                        {formatFecha(c.fechaHora)}
                      </span>
                      <span className="text-[12px] font-mono text-ink-500">
                        {formatHora(c.fechaHora)}
                      </span>
                      <span className="text-[12px] text-ink-500">
                        · Dr/a. {vet?.nombreCompleto ?? "Veterinario"}
                      </span>
                      <span className="ml-auto text-[11px] font-mono text-ink-500/70">
                        {c.codigo}
                      </span>
                      <ChevronRight
                        size={16}
                        className="text-ink-500/40 group-hover:text-moss-700 transition-colors"
                      />
                    </div>

                    {(c.peso != null ||
                      c.temperatura != null ||
                      c.condicionCorporal) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {c.peso != null && (
                          <span className="inline-flex items-baseline gap-1 rounded-full bg-moss-50 px-2.5 py-0.5 text-[12px]">
                            <Scale size={11} className="text-moss-600 self-center" />
                            <span className="font-semibold text-moss-800">{c.peso} kg</span>
                          </span>
                        )}
                        {c.temperatura != null && (
                          <span className="inline-flex items-baseline gap-1 rounded-full bg-bone-100 px-2.5 py-0.5 text-[12px]">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-clay-500 self-center">Temp</span>
                            <span className="font-semibold text-ink-700">{c.temperatura} °C</span>
                          </span>
                        )}
                        {c.condicionCorporal && (
                          <span className="inline-flex items-baseline gap-1 rounded-full bg-bone-100 px-2.5 py-0.5 text-[12px]">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-clay-500 self-center">Cond</span>
                            <span className="font-semibold text-ink-700">{c.condicionCorporal}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {c.diagnostico && (
                      <div className="mt-3 pl-3 border-l-2 border-moss-200">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-moss-700 mb-0.5">
                          Diagnóstico
                        </p>
                        <p className="text-[13.5px] text-ink-700 leading-relaxed">
                          {c.diagnostico}
                        </p>
                        {c.indicacionesSeguimiento && (
                          <p className="text-[12.5px] text-ink-500 mt-1.5 leading-relaxed">
                            <span className="font-semibold">Seguimiento: </span>
                            {c.indicacionesSeguimiento}
                          </p>
                        )}
                        {c.tratamiento && (
                          <p className="text-[12.5px] text-ink-500 mt-1.5 leading-relaxed">
                            <span className="font-semibold">Tratamiento: </span>
                            {c.tratamiento}
                          </p>
                        )}
                      </div>
                    )}

                    {!c.diagnostico && c.observaciones && (
                      <p className="text-[13px] text-ink-500 mt-2 leading-relaxed line-clamp-2">
                        {c.observaciones}
                      </p>
                    )}
                  </Card>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      <Modal
        open={estadoOpen}
        onClose={() => setEstadoOpen(false)}
        title="Estado del animal"
        subtitle="El refugio registra el estado y, al adoptarse, la salida y quién se lo llevó."
      >
        <form onSubmit={guardarEstado} className="space-y-4">
          <Combobox
            label="Estado"
            value={estadoForm.estado}
            onChange={(v) => setEstadoForm({ ...estadoForm, estado: v })}
            options={estadoOptions}
            searchPlaceholder="Buscar estado…"
          />

          {estadoForm.estado === "Adoptado" && (
            <>
              <Input
                label="Fecha de salida"
                type="date"
                required
                value={estadoForm.fechaSalida}
                onChange={(e) =>
                  setEstadoForm({ ...estadoForm, fechaSalida: e.target.value })
                }
              />
              <Combobox
                label="Rescatista que se lo llevó"
                value={estadoForm.adoptanteRescatistaId}
                onChange={(v) =>
                  setEstadoForm({ ...estadoForm, adoptanteRescatistaId: v })
                }
                options={rescatistaOptions}
                placeholder="Selecciona un rescatista…"
                searchPlaceholder="Buscar rescatista…"
                emptyText="No hay rescatistas"
              />
            </>
          )}

          {estadoForm.estado === "Devuelto" && (
            <>
              <Input
                label="Fecha de devolución"
                type="date"
                required
                value={estadoForm.fechaSalida}
                onChange={(e) =>
                  setEstadoForm({ ...estadoForm, fechaSalida: e.target.value })
                }
              />
              <Textarea
                label="¿En qué condiciones volvió?"
                placeholder="Estado general, lesiones, comportamiento…"
                maxLength={500}
                value={estadoForm.nota}
                onChange={(e) =>
                  setEstadoForm({ ...estadoForm, nota: e.target.value })
                }
              />
              <p className="text-[11px] text-ink-500">
                La adopción previa queda registrada en el historial. Luego podés
                agendar una consulta para revisar al animal.
              </p>
            </>
          )}

          {estadoError && <ErrorBox message={estadoError} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEstadoOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={estadoSaving}>
              {estadoSaving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-moss-600 mb-2">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
          {label}
        </span>
      </div>
      <p className="font-display text-2xl text-moss-800 leading-none truncate">
        {value}
      </p>
      {hint && <p className="text-[12px] text-ink-500 mt-1 truncate">{hint}</p>}
    </Card>
  );
}
