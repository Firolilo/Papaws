import { apiDelete, apiGet, apiList, apiLogin, apiPost, apiPut } from "./client";
import type {
  ActualizarConsultaDto,
  ActualizarObservacionesDto,
  ActualizarProductoDto,
  ActualizarRescatistaDto,
  ActualizarServicioDto,
  ActualizarVeterinarioDto,
  Animal,
  CambiarEstadoConsultaDto,
  Consulta,
  CrearAnimalDto,
  CrearConsultaDto,
  CrearProductoDto,
  CrearRescatistaDto,
  CrearServicioDto,
  CrearVeterinarioDto,
  EstablecerStockDto,
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
  remove: (id: string) => apiDelete("animales", `/api/rescatistas/${id}`),
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
