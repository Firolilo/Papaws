// Especies que el refugio acepta. Es una lista fija (no hay CRUD de especies): se usa como
// dropdown al ingresar un animal y como filtro en los reportes, para mantener todo consistente.
export const ESPECIES_ACEPTADAS = [
  "Perro",
  "Gato",
  "Conejo",
  "Ave",
  "Loro",
  "Tortuga",
  "Hámster",
] as const;

// Especialidades veterinarias disponibles. Lista fija (sin CRUD): dropdown al registrar un
// veterinario y filtro en los reportes.
export const ESPECIALIDADES_VETERINARIAS = [
  "Medicina General",
  "Cirugía",
  "Dermatología",
  "Odontología",
  "Exóticos",
  "Nutrición",
] as const;
