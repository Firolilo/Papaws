import type { LoginDto, PaginaResultado, TokenResponse } from "../types";

const ANIMALES_BASE =
  import.meta.env.VITE_API_ANIMALES ?? "http://localhost:8080";
const CONSULTA_BASE =
  import.meta.env.VITE_API_CONSULTA ?? "http://localhost:8081";

export type ApiZone = "animales" | "consulta";

const TOKEN_KEY = "papaws_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function baseFor(zone: ApiZone) {
  return zone === "animales" ? ANIMALES_BASE : CONSULTA_BASE;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Token ausente, inválido o expirado: cerramos sesión y avisamos a la app.
    setToken(null);
    window.dispatchEvent(new Event("papaws:unauthorized"));
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message =
      (data && (data.mensaje || data.message || data.title)) ||
      `Error ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function apiGet<T>(zone: ApiZone, path: string): Promise<T> {
  const res = await fetch(`${baseFor(zone)}${path}`, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  return handle<T>(res);
}

/** GET de un listado paginado; devuelve solo los items (pide el tamaño máximo). */
export async function apiList<T>(zone: ApiZone, path: string): Promise<T[]> {
  const sep = path.includes("?") ? "&" : "?";
  const page = await apiGet<PaginaResultado<T>>(zone, `${path}${sep}tamano=100`);
  return page.items;
}

export async function apiPost<T>(
  zone: ApiZone,
  path: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${baseFor(zone)}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiPut<T>(
  zone: ApiZone,
  path: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${baseFor(zone)}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiDelete(zone: ApiZone, path: string): Promise<void> {
  const res = await fetch(`${baseFor(zone)}${path}`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  return handle<void>(res);
}

/** Login: lo emite el servicio de Animales y NO requiere token previo. */
export async function apiLogin(dto: LoginDto): Promise<TokenResponse> {
  const res = await fetch(`${ANIMALES_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(dto),
  });
  return handle<TokenResponse>(res);
}
