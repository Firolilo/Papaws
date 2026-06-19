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
