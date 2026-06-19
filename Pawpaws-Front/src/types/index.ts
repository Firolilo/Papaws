export interface Organizacion {
  id: string;
  nombre: string;
  tipo: string;
}

export interface CrearOrganizacionDto {
  nombre: string;
  tipo: string;
}

export type ActualizarOrganizacionDto = CrearOrganizacionDto;

export interface Rescatista {
  id: string;
  nombreCompleto: string;
  telefonoContacto: string;
  correoElectronico: string;
  // Nombre de la organización (snapshot para mostrar).
  organizacion: string;
  organizacionId?: string | null;
  zonaOperacion: string;
  // Rescatista interno (p. ej. "Refugio"): no se ofrece como seleccionable ni se gestiona.
  oculto: boolean;
  // false = dado de baja. Los listados solo traen activos; al pedirlo por id puede venir en baja.
  activo: boolean;
}

export interface CrearRescatistaDto {
  nombreCompleto: string;
  telefonoContacto: string;
  correoElectronico: string;
  organizacionId: string;
  zonaOperacion: string;
}

export type EstadoAnimal =
  | "Disponible"
  | "EnTratamiento"
  | "Adoptado"
  | "Devuelto";

export interface EventoAdopcion {
  fecha: string;
  tipo: "Adoptado" | "Devuelto" | string;
  rescatistaId?: string | null;
  nota?: string | null;
}

export interface EventoOrganizacion {
  fecha: string;
  tipo: "Alta" | "Cambio" | string;
  organizacionAnterior?: string | null;
  organizacionNueva: string;
}

export interface EventoCustodia {
  fecha: string;
  tipo: "Ingreso" | "Reasignacion" | string;
  rescatistaAnterior?: string | null;
  rescatistaNuevo: string;
}

export interface Animal {
  id: string;
  nombre: string;
  especie: string;
  pesoActual: number;
  fechaIngreso: string;
  rescatistaId: string;
  estado: EstadoAnimal | string;
  fechaSalida?: string | null;
  adoptanteRescatistaId?: string | null;
}

export interface CambiarEstadoAnimalDto {
  estado: string;
  fechaSalida?: string | null;
  adoptanteRescatistaId?: string | null;
  nota?: string | null;
}

export interface CrearAnimalDto {
  nombre: string;
  especie: string;
  pesoActual: number;
  rescatistaId: string;
  // Opcional: si se omite, el backend usa la fecha/hora actual.
  fechaIngreso?: string | null;
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
  fechaVencimiento?: string | null;
}

export interface CrearProductoDto {
  nombre: string;
  tipo: string;
  unidadMedida: string;
  stockDisponible: number;
  fechaVencimiento?: string | null;
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
  tratamiento?: string | null;
  ameritaTratamiento?: boolean | null;
  proximoControl?: string | null;
  peso?: number | null;
  temperatura?: number | null;
  condicionCorporal?: string | null;
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
  tratamiento?: string | null;
  ameritaTratamiento?: boolean | null;
  proximoControl?: string | null;
  peso?: number | null;
  temperatura?: number | null;
  condicionCorporal?: string | null;
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
  fechaVencimiento?: string | null;
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
