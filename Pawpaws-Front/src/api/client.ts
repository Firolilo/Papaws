const ANIMALES_BASE =
  import.meta.env.VITE_API_ANIMALES ?? "http://localhost:8080";
const CONSULTA_BASE =
  import.meta.env.VITE_API_CONSULTA ?? "http://localhost:8081";

export type ApiZone = "animales" | "consulta";

function baseFor(zone: ApiZone) {
  return zone === "animales" ? ANIMALES_BASE : CONSULTA_BASE;
}

async function handle<T>(res: Response): Promise<T> {
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
    headers: { Accept: "application/json" },
  });
  return handle<T>(res);
}

export async function apiPost<T>(
  zone: ApiZone,
  path: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${baseFor(zone)}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
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
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}
