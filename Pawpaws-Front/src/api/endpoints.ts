import { apiGet, apiPost, apiPut } from "./client";
import type {
  ActualizarConsultaDto,
  ActualizarObservacionesDto,
  Animal,
  CambiarEstadoConsultaDto,
  Consulta,
  CrearAnimalDto,
  CrearConsultaDto,
  CrearProductoDto,
  CrearRescatistaDto,
  CrearServicioDto,
  CrearVeterinarioDto,
  Producto,
  ProductoUsadoDto,
  RegistrarDiagnosticoDto,
  ReprogramarConsultaDto,
  Rescatista,
  Servicio,
  Veterinario,
} from "../types";

export const rescatistasApi = {
  list: () => apiGet<Rescatista[]>("animales", "/api/rescatistas"),
  get: (id: string) => apiGet<Rescatista>("animales", `/api/rescatistas/${id}`),
  create: (dto: CrearRescatistaDto) =>
    apiPost<Rescatista>("animales", "/api/rescatistas", dto),
};

export const animalesApi = {
  list: () => apiGet<Animal[]>("animales", "/api/animales"),
  get: (id: string) => apiGet<Animal>("animales", `/api/animales/${id}`),
  porRescatista: (rescatistaId: string) =>
    apiGet<Animal[]>("animales", `/api/animales/rescatista/${rescatistaId}`),
  create: (dto: CrearAnimalDto) =>
    apiPost<Animal>("animales", "/api/animales", dto),
  update: (id: string, dto: CrearAnimalDto) =>
    apiPut<void>("animales", `/api/animales/${id}`, dto),
};

export const veterinariosApi = {
  list: () => apiGet<Veterinario[]>("consulta", "/api/veterinarios"),
  get: (id: string) =>
    apiGet<Veterinario>("consulta", `/api/veterinarios/${id}`),
  create: (dto: CrearVeterinarioDto) =>
    apiPost<Veterinario>("consulta", "/api/veterinarios", dto),
};

export const serviciosApi = {
  list: () => apiGet<Servicio[]>("consulta", "/api/servicios"),
  create: (dto: CrearServicioDto) =>
    apiPost<Servicio>("consulta", "/api/servicios", dto),
};

export const productosApi = {
  list: () => apiGet<Producto[]>("consulta", "/api/productos"),
  create: (dto: CrearProductoDto) =>
    apiPost<Producto>("consulta", "/api/productos", dto),
};

export const consultasApi = {
  list: () => apiGet<Consulta[]>("consulta", "/api/consultas"),
  get: (codigo: string) =>
    apiGet<Consulta>("consulta", `/api/consultas/${codigo}`),
  create: (dto: CrearConsultaDto) =>
    apiPost<Consulta>("consulta", "/api/consultas", dto),
  actualizar: (codigo: string, dto: ActualizarConsultaDto) =>
    apiPut<void>("consulta", `/api/consultas/${codigo}`, dto),
  cambiarEstado: (codigo: string, dto: CambiarEstadoConsultaDto) =>
    apiPut<void>("consulta", `/api/consultas/${codigo}/estado`, dto),
  reprogramar: (codigo: string, dto: ReprogramarConsultaDto) =>
    apiPut<void>("consulta", `/api/consultas/${codigo}/reprogramar`, dto),
  actualizarObservaciones: (codigo: string, dto: ActualizarObservacionesDto) =>
    apiPut<void>(
      "consulta",
      `/api/consultas/${codigo}/observaciones`,
      dto
    ),
  registrarDiagnostico: (codigo: string, dto: RegistrarDiagnosticoDto) =>
    apiPut<void>("consulta", `/api/consultas/${codigo}/diagnostico`, dto),
  registrarProductos: (codigo: string, productos: ProductoUsadoDto[]) =>
    apiPost<void>(
      "consulta",
      `/api/consultas/${codigo}/productos`,
      productos
    ),
  obtenerProductosUsados: (codigo: string) =>
    apiGet<ProductoUsadoDto[]>(
      "consulta",
      `/api/consultas/${codigo}/productos`
    ),
};
