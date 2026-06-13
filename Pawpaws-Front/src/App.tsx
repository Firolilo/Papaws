import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Rescatistas } from "./pages/Rescatistas";
import { Animales } from "./pages/Animales";
import { Veterinarios } from "./pages/Veterinarios";
import { Servicios } from "./pages/Servicios";
import { Productos } from "./pages/Productos";
import { Consultas } from "./pages/Consultas";
import { ConsultaDetalle } from "./pages/ConsultaDetalle";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="rescatistas" element={<Rescatistas />} />
        <Route path="animales" element={<Animales />} />
        <Route path="veterinarios" element={<Veterinarios />} />
        <Route path="servicios" element={<Servicios />} />
        <Route path="productos" element={<Productos />} />
        <Route path="consultas" element={<Consultas />} />
        <Route path="consultas/:codigo" element={<ConsultaDetalle />} />
      </Route>
    </Routes>
  );
}
