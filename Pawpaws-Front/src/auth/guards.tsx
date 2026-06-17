import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Rol } from "../types";

/** Exige sesión iniciada; si no, redirige al login. */
export function ProtectedRoute() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Restringe un grupo de rutas a ciertos roles; si no, vuelve al inicio. */
export function RoleRoute({ allow }: { allow: Rol[] }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!allow.includes(usuario.rol)) return <Navigate to="/" replace />;
  return <Outlet />;
}
