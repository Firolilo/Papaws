import { NavLink, Outlet } from "react-router-dom";
import {
  CalendarHeart,
  HeartHandshake,
  Home,
  PawPrint,
  Pill,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { Logo } from "./Logo";
import { Mascot } from "./Mascot";

const nav = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/consultas", label: "Consultas", icon: CalendarHeart },
  { to: "/animales", label: "Animales", icon: PawPrint },
  { to: "/rescatistas", label: "Rescatistas", icon: HeartHandshake },
  { to: "/veterinarios", label: "Veterinarios", icon: Stethoscope },
  { to: "/servicios", label: "Servicios", icon: Syringe },
  { to: "/productos", label: "Inventario", icon: Pill },
];

export function Layout() {
  return (
    <div className="min-h-screen flex bg-bone-50">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-moss-100 bg-white sticky top-0 h-screen">
        <div className="px-6 pt-7 pb-6 flex items-center gap-3">
          <Logo size={36} />
          <div>
            <p className="font-display text-2xl text-moss-800 leading-none">
              Papaws
            </p>
            <p className="font-hand text-[15px] text-clay-500 leading-none mt-1">
              refugio &amp; cuidado
            </p>
          </div>
        </div>

        <nav className="px-3 flex-1 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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

        <div className="m-3 p-5 rounded-xl2 bg-gradient-to-br from-moss-700 to-moss-800 text-white relative overflow-hidden paw-confetti">
          <div className="relative">
            <p className="font-hand text-2xl leading-none text-clay-300">
              ¡A cuidar!
            </p>
            <p className="font-display text-xl mt-1.5 leading-tight">
              Cada huella<br />es una historia.
            </p>
            <div className="flex -mt-2 -mb-4 -mr-2 justify-end">
              <Mascot size={92} />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 relative">
        <header className="lg:hidden border-b border-moss-100 px-5 py-3 flex items-center gap-3 bg-white sticky top-0 z-10">
          <Logo size={26} />
          <p className="font-display text-xl text-moss-800">Papaws</p>
        </header>
        <div className="px-5 sm:px-10 lg:px-14 py-10 lg:py-14 max-w-[1280px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
