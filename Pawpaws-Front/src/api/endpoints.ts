import { apiDelete, apiGet, apiList, apiLogin, apiPost, apiPut, REPORTES_BASE, getToken } from "./client";
import type {
  ActualizarConsultaDto,
  ActualizarObservacionesDto,
  ActualizarProductoDto,
  ActualizarRescatistaDto,
  ActualizarServicioDto,
  ActualizarVeterinarioDto,
  Animal,
  CambiarEstadoAnimalDto,
  CambiarEstadoConsultaDto,
  Consulta,
  CrearAnimalDto,
  CrearConsultaDto,
  CrearProductoDto,
  CrearOrganizacionDto,
  ActualizarOrganizacionDto,
  Organizacion,
  CrearRescatistaDto,
  CrearServicioDto,
  CrearVeterinarioDto,
  EstablecerStockDto,
  EventoAdopcion,
  EventoCustodia,
  EventoOrganizacion,
  LoginDto,
  Producto,
  ProductoUsadoDto,
  RegistrarDiagnosticoDto,
  ReprogramarConsultaDto,
  Rescatista,
  Servicio,
  Veterinario,
} from "../types";

export const authApi = {
  login: (dto: LoginDto) => apiLogin(dto),
};

export const rescatistasApi = {
  list: () => apiList<Rescatista>("animales", "/api/rescatistas"),
  get: (id: string) => apiGet<Rescatista>("animales", `/api/rescatistas/${id}`),
  create: (dto: CrearRescatistaDto) =>
    apiPost<Rescatista>("animales", "/api/rescatistas", dto),
  update: (id: string, dto: ActualizarRescatistaDto) =>
    apiPut<void>("animales", `/api/rescatistas/${id}`, dto),
  historialOrganizaciones: (id: string) =>
    apiGet<EventoOrganizacion[]>("animales", `/api/rescatistas/${id}/organizaciones`),
  // reasignarA: rescatista al que se mueven los animales. Si se omite, el backend usa "Refugio".
  remove: (id: string, reasignarA?: string) =>
    apiDelete(
      "animales",
      reasignarA
        ? `/api/rescatistas/${id}?reasignarA=${reasignarA}`
        : `/api/rescatistas/${id}`
    ),
};

export const organizacionesApi = {
  list: () => apiList<Organizacion>("animales", "/api/organizaciones"),
  get: (id: string) => apiGet<Organizacion>("animales", `/api/organizaciones/${id}`),
  create: (dto: CrearOrganizacionDto) =>
    apiPost<Organizacion>("animales", "/api/organizaciones", dto),
  update: (id: string, dto: ActualizarOrganizacionDto) =>
    apiPut<void>("animales", `/api/organizaciones/${id}`, dto),
  remove: (id: string) => apiDelete("animales", `/api/organizaciones/${id}`),
};

export const animalesApi = {
  list: () => apiList<Animal>("animales", "/api/animales"),
  get: (id: string) => apiGet<Animal>("animales", `/api/animales/${id}`),
  porRescatista: (rescatistaId: string) =>
    apiGet<Animal[]>("animales", `/api/animales/rescatista/${rescatistaId}`),
  create: (dto: CrearAnimalDto) =>
    apiPost<Animal>("animales", "/api/animales", dto),
  update: (id: string, dto: CrearAnimalDto) =>
    apiPut<void>("animales", `/api/animales/${id}`, dto),
  cambiarEstado: (id: string, dto: CambiarEstadoAnimalDto) =>
    apiPut<void>("animales", `/api/animales/${id}/estado`, dto),
  adopciones: (id: string) =>
    apiGet<EventoAdopcion[]>("animales", `/api/animales/${id}/adopciones`),
  custodia: (id: string) =>
    apiGet<EventoCustodia[]>("animales", `/api/animales/${id}/custodia`),
  remove: (id: string) => apiDelete("animales", `/api/animales/${id}`),
};

export const veterinariosApi = {
  list: () => apiList<Veterinario>("consulta", "/api/veterinarios"),
  get: (id: string) =>
    apiGet<Veterinario>("consulta", `/api/veterinarios/${id}`),
  create: (dto: CrearVeterinarioDto) =>
    apiPost<Veterinario>("consulta", "/api/veterinarios", dto),
  update: (id: string, dto: ActualizarVeterinarioDto) =>
    apiPut<void>("consulta", `/api/veterinarios/${id}`, dto),
  remove: (id: string) => apiDelete("consulta", `/api/veterinarios/${id}`),
};

export const serviciosApi = {
  list: () => apiList<Servicio>("consulta", "/api/servicios"),
  get: (id: string) => apiGet<Servicio>("consulta", `/api/servicios/${id}`),
  create: (dto: CrearServicioDto) =>
    apiPost<Servicio>("consulta", "/api/servicios", dto),
  update: (id: string, dto: ActualizarServicioDto) =>
    apiPut<void>("consulta", `/api/servicios/${id}`, dto),
  remove: (id: string) => apiDelete("consulta", `/api/servicios/${id}`),
};

export const productosApi = {
  list: () => apiList<Producto>("consulta", "/api/productos"),
  get: (id: string) => apiGet<Producto>("consulta", `/api/productos/${id}`),
  create: (dto: CrearProductoDto) =>
    apiPost<Producto>("consulta", "/api/productos", dto),
  update: (id: string, dto: ActualizarProductoDto) =>
    apiPut<void>("consulta", `/api/productos/${id}`, dto),
  establecerStock: (id: string, dto: EstablecerStockDto) =>
    apiPut<void>("consulta", `/api/productos/${id}/stock`, dto),
  remove: (id: string) => apiDelete("consulta", `/api/productos/${id}`),
};

export const consultasApi = {
  list: () => apiList<Consulta>("consulta", "/api/consultas"),
  get: (codigo: string) =>
    apiGet<Consulta>("consulta", `/api/consultas/${codigo}`),
  porAnimal: (animalId: string) =>
    apiGet<Consulta[]>("consulta", `/api/consultas/animal/${animalId}`),
  porVeterinario: (veterinarioId: string) =>
    apiGet<Consulta[]>(
      "consulta",
      `/api/consultas/veterinario/${veterinarioId}`
    ),
  porServicio: (servicioId: string) =>
    apiGet<Consulta[]>("consulta", `/api/consultas/servicio/${servicioId}`),
  create: (dto: CrearConsultaDto) =>
    apiPost<Consulta>("consulta", "/api/consultas", dto),
  actualizar: (codigo: string, dto: ActualizarConsultaDto) =>
    apiPut<void>("consulta", `/api/consultas/${codigo}`, dto),
  cambiarEstado: (codigo: string, dto: CambiarEstadoConsultaDto) =>
    apiPut<void>("consulta", `/api/consultas/${codigo}/estado`, dto),
  reprogramar: (codigo: string, dto: ReprogramarConsultaDto) =>
    apiPut<void>("consulta", `/api/consultas/${codigo}/reprogramar`, dto),
  actualizarObservaciones: (codigo: string, dto: ActualizarObservacionesDto) =>
    apiPut<void>("consulta", `/api/consultas/${codigo}/observaciones`, dto),
  registrarDiagnostico: (codigo: string, dto: RegistrarDiagnosticoDto) =>
    apiPut<void>("consulta", `/api/consultas/${codigo}/diagnostico`, dto),
  registrarProductos: (codigo: string, productos: ProductoUsadoDto[]) =>
    apiPost<void>("consulta", `/api/consultas/${codigo}/productos`, productos),
  obtenerProductosUsados: (codigo: string) =>
    apiGet<ProductoUsadoDto[]>(
      "consulta",
      `/api/consultas/${codigo}/productos`
    ),
  cancelar: (codigo: string) =>
    apiDelete("consulta", `/api/consultas/${codigo}`),
};

// ── Reportes (servicio independiente en :8082) ─────────────────────────────
async function reportesGet<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${REPORTES_BASE}${path}`, {
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (res.status === 404) return null as T;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const data = text ? JSON.parse(text) : {};
    throw new Error(data.title || data.mensaje || `Error ${res.status}`);
  }
  return res.json();
}

export const reportesApi = {
  c1_rescatistaPorId:         (id: string)        => reportesGet<unknown>(`/api/reportes/rescatistas/${id}`),
  c2_animalesPorRescatista:   (id: string)        => reportesGet<unknown>(`/api/reportes/rescatistas/${id}/animales`),
  c3_animalesPorEspecie:      (especie: string)   => reportesGet<unknown>(`/api/reportes/animales/especie/${encodeURIComponent(especie)}?tamano=100`),
  c4_consultasPorAnimal:      (id: string)        => reportesGet<unknown>(`/api/reportes/animales/${id}/consultas`),
  c5_consultasPorVeterinario: (id: string)        => reportesGet<unknown>(`/api/reportes/veterinarios/${id}/consultas`),
  c6_detalleConsulta:         (codigo: string)    => reportesGet<unknown>(`/api/reportes/consultas/${encodeURIComponent(codigo)}/detalle`),
  c7_consultasPorEstado:      (estado: string)    => reportesGet<unknown>(`/api/reportes/consultas/por-estado/${encodeURIComponent(estado)}?tamano=100`),
  c8_serviciosPorConsulta:    (codigo: string)    => reportesGet<unknown>(`/api/reportes/consultas/${encodeURIComponent(codigo)}/servicios`),
  c9_productosPorConsulta:    (codigo: string)    => reportesGet<unknown>(`/api/reportes/consultas/${encodeURIComponent(codigo)}/productos`),
  c10_productosPorStock:      ()                  => reportesGet<unknown>(`/api/reportes/productos/por-stock?tamano=100`),
  c11_servicioPorId:          (id: string)        => reportesGet<unknown>(`/api/reportes/servicios/${id}`),
  c12_veterinarioPorId:       (id: string)        => reportesGet<unknown>(`/api/reportes/veterinarios/${id}`),
  c13_veterinariosPorEsp:     (esp: string)       => reportesGet<unknown>(`/api/reportes/veterinarios/especialidad/${encodeURIComponent(esp)}?tamano=100`),
  c14_productoPorId:          (id: string)        => reportesGet<unknown>(`/api/reportes/productos/${id}`),
  c15_consultaPorCodigo:      (codigo: string)    => reportesGet<unknown>(`/api/reportes/consultas/${encodeURIComponent(codigo)}`),
  c16_consultasPorFecha:      (fecha: string)     => reportesGet<unknown>(`/api/reportes/consultas/por-fecha/${fecha}?tamano=100`),
  c17_animalesPorNombre:      (nombre: string)    => reportesGet<unknown>(`/api/reportes/animales/nombre/${encodeURIComponent(nombre)}?tamano=100`),
  c19_rescatistasPorZona:     (zona: string)      => reportesGet<unknown>(`/api/reportes/rescatistas/zona/${encodeURIComponent(zona)}?tamano=100`),
  c20_organizacionDetalle:    (id: string)        => reportesGet<unknown>(`/api/reportes/organizaciones/${id}/detalle`),
  c21_rescatistasPorTipoOrg:  (tipo: string)      => reportesGet<unknown>(`/api/reportes/organizaciones/tipo/${encodeURIComponent(tipo)}?tamano=100`),
};

// ── Seed (solo desarrollo) ─────────────────────────────────────────────────
export const seedApi = {
  animales: () => apiPost<{ sembrado: boolean; animalIds: string[]; mensaje: string }>("animales", "/api/seed", {}),
  consulta: (animalIds: string[]) => apiPost<{ sembrado: boolean; mensaje: string }>("consulta", "/api/seed", { animalIds }),
};
