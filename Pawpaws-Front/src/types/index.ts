export interface Rescatista {
  id: string;
  nombreCompleto: string;
  telefonoContacto: string;
  correoElectronico: string;
  organizacion: string;
  zonaOperacion: string;
  // Rescatista interno (p. ej. "Refugio"): no se ofrece como seleccionable ni se gestiona.
  oculto: boolean;
}

export interface CrearRescatistaDto {
  nombreCompleto: string;
  telefonoContacto: string;
  correoElectronico: string;
  organizacion: string;
  zonaOperacion: string;
}

export interface Animal {
  id: string;
  nombre: string;
  especie: string;
  pesoActual: number;
  fechaIngreso: string;
  rescatistaId: string;
}

export interface CrearAnimalDto {
  nombre: string;
  especie: string;
  pesoActual: number;
  rescatistaId: string;
}

export interface Veterinario {
  id: string;
  nombreCompleto: string;
  telefonoContacto: string;
  especialidadPrincipal: string;
}

export interface CrearVeterinarioDto {
  nombreCompleto: string;
  telefonoContacto: string;
  especialidadPrincipal: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  duracionEstimadaMinutos: number;
  precioBase: number;
}

export interface CrearServicioDto {
  nombre: string;
  descripcion: string;
  duracionEstimadaMinutos: number;
  precioBase: number;
}

export interface Producto {
  id: string;
  nombre: string;
  tipo: string;
  unidadMedida: string;
  stockDisponible: number;
}

export interface CrearProductoDto {
  nombre: string;
  tipo: string;
  unidadMedida: string;
  stockDisponible: number;
}

export type EstadoConsulta =
  | "Pendiente"
  | "Confirmada"
  | "Cancelada"
  | "Completada";

export interface Consulta {
  codigo: string;
  fechaHora: string;
  estado: EstadoConsulta | string;
  observaciones: string;
  diagnostico?: string | null;
  indicacionesSeguimiento?: string | null;
  animalId: string;
  veterinarioId: string;
  servicioIds: string[];
  productosUsados?: ProductoUsadoDto[];
}

export interface ActualizarConsultaDto {
  fechaHora: string;
  observaciones: string;
  servicioIds: string[];
}

export interface CambiarEstadoConsultaDto {
  estado: string;
}

export interface ReprogramarConsultaDto {
  fechaHora: string;
}

export interface ActualizarObservacionesDto {
  observaciones: string;
}

export interface CrearConsultaDto {
  codigo: string;
  fechaHora: string;
  estado: string;
  observaciones: string;
  animalId: string;
  veterinarioId: string;
  servicioIds: string[];
}

export interface RegistrarDiagnosticoDto {
  diagnostico: string;
  indicacionesSeguimiento: string;
}

export interface ProductoUsadoDto {
  productoId: string;
  cantidadUsada: number;
}

// --- Actualización (PUT) ---
export type ActualizarRescatistaDto = CrearRescatistaDto;
export type ActualizarVeterinarioDto = CrearVeterinarioDto;
export type ActualizarServicioDto = CrearServicioDto;

export interface ActualizarProductoDto {
  nombre: string;
  tipo: string;
  unidadMedida: string;
}

export interface EstablecerStockDto {
  stockDisponible: number;
}

// --- Autenticación ---
export type Rol = "Administrador" | "EncargadoConsultas" | "EncargadoRescatistas";

export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  expiraUtc: string;
  email: string;
  rol: Rol;
}

// --- Paginación (forma de respuesta de los listados) ---
export interface PaginaResultado<T> {
  items: T[];
  pagina: number;
  tamano: number;
  total: number;
  totalPaginas: number;
}
