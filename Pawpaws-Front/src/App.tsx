import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./components/Toast";
import { ProtectedRoute, RoleRoute } from "./auth/guards";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Rescatistas } from "./pages/Rescatistas";
import { RescatistaDetalle } from "./pages/RescatistaDetalle";
import { Organizaciones } from "./pages/Organizaciones";
import { OrganizacionDetalle } from "./pages/OrganizacionDetalle";
import { Animales } from "./pages/Animales";
import { AnimalDetalle } from "./pages/AnimalDetalle";
import { Veterinarios } from "./pages/Veterinarios";
import { VeterinarioDetalle } from "./pages/VeterinarioDetalle";
import { Servicios } from "./pages/Servicios";
import { ServicioDetalle } from "./pages/ServicioDetalle";
import { Productos } from "./pages/Productos";
import { Consultas } from "./pages/Consultas";
import { ConsultaDetalle } from "./pages/ConsultaDetalle";
import { Gastos } from "./pages/Gastos";
import { Reportes } from "./pages/Reportes";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              {/* Lectura de animales/rescatistas: cualquier rol autenticado */}
              <Route path="rescatistas" element={<Rescatistas />} />
              <Route path="rescatistas/:id" element={<RescatistaDetalle />} />
              <Route path="organizaciones" element={<Organizaciones />} />
              <Route path="organizaciones/:id" element={<OrganizacionDetalle />} />
              <Route path="animales" element={<Animales />} />
              <Route path="animales/:id" element={<AnimalDetalle />} />

            {/* Reportes: cualquier rol autenticado */}
            <Route path="reportes" element={<Reportes />} />

            {/* Módulo de consultas: solo Administrador y Encargado de consultas */}
            <Route
              element={
                <RoleRoute allow={["Administrador", "EncargadoConsultas"]} />
              }
            >
              <Route path="veterinarios" element={<Veterinarios />} />
              <Route path="veterinarios/:id" element={<VeterinarioDetalle />} />
              <Route path="servicios" element={<Servicios />} />
              <Route path="servicios/:id" element={<ServicioDetalle />} />
              <Route path="productos" element={<Productos />} />
              <Route path="consultas" element={<Consultas />} />
              <Route path="consultas/:codigo" element={<ConsultaDetalle />} />
              <Route path="gastos" element={<Gastos />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
