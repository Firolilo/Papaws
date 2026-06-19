import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart2,
  Building2,
  CalendarHeart,
  HeartHandshake,
  Home,
  LogOut,
  Menu,
  PawPrint,
  Pill,
  Stethoscope,
  Syringe,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { Mascot } from "./Mascot";
import { useAuth } from "../auth/AuthContext";

const nav = [
  { to: "/", label: "Inicio", icon: Home, end: true, soloConsultas: false },
  { to: "/consultas", label: "Consultas", icon: CalendarHeart, soloConsultas: true },
  { to: "/animales", label: "Animales", icon: PawPrint, soloConsultas: false },
  { to: "/rescatistas", label: "Rescatistas", icon: HeartHandshake, soloConsultas: false },
  { to: "/organizaciones", label: "Organizaciones", icon: Building2, soloConsultas: false },
  { to: "/veterinarios", label: "Veterinarios", icon: Stethoscope, soloConsultas: true },
  { to: "/servicios", label: "Servicios", icon: Syringe, soloConsultas: true },
  { to: "/productos", label: "Inventario", icon: Pill, soloConsultas: true },
  { to: "/reportes", label: "Reportes", icon: BarChart2, soloConsultas: false },
];

const etiquetaRol: Record<string, string> = {
  Administrador: "Administrador",
  EncargadoConsultas: "Enc. de consultas",
  EncargadoRescatistas: "Enc. de rescatistas",
};

export function Layout() {
  const { usuario, logout, puedeAccederConsultas } = useAuth();
  const items = nav.filter((n) => !n.soloConsultas || puedeAccederConsultas);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Cerrar el drawer al navegar.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Bloquear el scroll del fondo mientras el drawer está abierto.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const NavItems = () => (
    <nav className="px-3 flex-1 space-y-0.5 overflow-y-auto">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[14px] font-semibold transition-all ${
              isActive
                ? "bg-moss-700 text-white shadow-soft"
                : "text-ink-500 hover:bg-moss-50 hover:text-moss-800"
            }`
          }
        >
          <Icon size={17} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const UserCard = () =>
    usuario ? (
      <div className="mx-3 mb-2 p-3 rounded-2xl bg-bone-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-moss-700 text-white font-display text-base flex items-center justify-center shrink-0">
          {usuario.email.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-moss-800 truncate">
            {usuario.email}
          </p>
          <p className="text-[11px] text-clay-600 font-medium">
            {etiquetaRol[usuario.rol] ?? usuario.rol}
          </p>
        </div>
        <button
          onClick={logout}
          title="Cerrar sesión"
          className="p-2 rounded-lg text-ink-500 hover:bg-clay-50 hover:text-clay-600 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    ) : null;

  const BrandHeader = () => (
    <div className="px-6 pt-7 pb-6 flex items-center gap-3">
      <Logo size={36} />
      <div>
        <p className="font-display text-2xl text-moss-800 leading-none">Papaws</p>
        <p className="font-hand text-[15px] text-clay-500 leading-none mt-1">
          refugio &amp; cuidado
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-bone-50">
      {/* Sidebar de escritorio */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-moss-100 bg-white sticky top-0 h-screen">
        <BrandHeader />
        <NavItems />
        <UserCard />
        <div className="m-3 p-5 rounded-xl2 bg-gradient-to-br from-moss-700 to-moss-800 text-white relative overflow-hidden paw-confetti">
          <div className="relative">
            <p className="font-hand text-2xl leading-none text-clay-300">¡A cuidar!</p>
            <p className="font-display text-xl mt-1.5 leading-tight">
              Cada huella<br />es una historia.
            </p>
            <div className="flex -mt-2 -mb-4 -mr-2 justify-end">
              <Mascot size={92} />
            </div>
          </div>
        </div>
      </aside>

      {/* Drawer móvil */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-[fadeIn_150ms_ease]"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] bg-white h-full flex flex-col shadow-card animate-[slideIn_200ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex items-center justify-between pr-3">
              <BrandHeader />
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg text-ink-500 hover:bg-moss-50"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>
            <NavItems />
            <UserCard />
          </aside>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
        </div>
      )}

      <main className="flex-1 min-w-0 relative">
        {/* Header móvil con hamburguesa */}
        <header className="lg:hidden border-b border-moss-100 px-4 py-3 flex items-center gap-3 bg-white sticky top-0 z-40">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-1 rounded-lg text-moss-700 hover:bg-moss-50"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <Logo size={24} />
          <p className="font-display text-xl text-moss-800">Papaws</p>
          {usuario && (
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="ml-auto p-2 rounded-lg text-ink-500 hover:bg-clay-50 hover:text-clay-600"
            >
              <LogOut size={18} />
            </button>
          )}
        </header>
        <div className="px-5 sm:px-10 lg:px-14 py-8 lg:py-14 max-w-[1280px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
