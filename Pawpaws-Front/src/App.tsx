import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute, RoleRoute } from "./auth/guards";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Rescatistas } from "./pages/Rescatistas";
import { Animales } from "./pages/Animales";
import { Veterinarios } from "./pages/Veterinarios";
import { Servicios } from "./pages/Servicios";
import { Productos } from "./pages/Productos";
import { Consultas } from "./pages/Consultas";
import { ConsultaDetalle } from "./pages/ConsultaDetalle";
import { Reportes } from "./pages/Reportes";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            {/* Lectura de animales/rescatistas: cualquier rol autenticado */}
            <Route path="rescatistas" element={<Rescatistas />} />
            <Route path="animales" element={<Animales />} />

            {/* Reportes: cualquier rol autenticado */}
            <Route path="reportes" element={<Reportes />} />

            {/* Módulo de consultas: solo Administrador y Encargado de consultas */}
            <Route
              element={
                <RoleRoute allow={["Administrador", "EncargadoConsultas"]} />
              }
            >
              <Route path="veterinarios" element={<Veterinarios />} />
              <Route path="servicios" element={<Servicios />} />
              <Route path="productos" element={<Productos />} />
              <Route path="consultas" element={<Consultas />} />
              <Route path="consultas/:codigo" element={<ConsultaDetalle />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
