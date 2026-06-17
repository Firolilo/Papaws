import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "../api/endpoints";
import { setToken } from "../api/client";
import type { LoginDto, Rol } from "../types";

interface Usuario {
  email: string;
  rol: Rol;
}

interface AuthContextValue {
  usuario: Usuario | null;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => void;
  /** Crear/editar/eliminar animales y rescatistas. */
  puedeGestionarAnimales: boolean;
  /** Acceder al módulo de consultas (consultas, veterinarios, servicios, productos). */
  puedeAccederConsultas: boolean;
}

const USER_KEY = "papaws_user";

const AuthContext = createContext<AuthContextValue | null>(null);

function leerUsuario(): Usuario | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuario);

  // Si una respuesta 401 invalida la sesión, limpiamos el usuario.
  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem(USER_KEY);
      setUsuario(null);
    };
    window.addEventListener("papaws:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("papaws:unauthorized", onUnauthorized);
  }, []);

  async function login(dto: LoginDto) {
    const respuesta = await authApi.login(dto);
    setToken(respuesta.token);
    const u: Usuario = { email: respuesta.email, rol: respuesta.rol };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUsuario(u);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUsuario(null);
  }

  const value = useMemo<AuthContextValue>(() => {
    const rol = usuario?.rol;
    return {
      usuario,
      login,
      logout,
      puedeGestionarAnimales:
        rol === "Administrador" || rol === "EncargadoRescatistas",
      puedeAccederConsultas:
        rol === "Administrador" || rol === "EncargadoConsultas",
    };
  }, [usuario]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return ctx;
}
