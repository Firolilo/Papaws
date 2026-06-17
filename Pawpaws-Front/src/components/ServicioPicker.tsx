import { useState } from "react";
import { Search } from "lucide-react";
import type { Servicio } from "../types";

interface Props {
  servicios: Servicio[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function ServicioPicker({ servicios, selectedIds, onToggle }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? servicios.filter(
        (s) =>
          s.nombre.toLowerCase().includes(q) ||
          s.descripcion.toLowerCase().includes(q)
      )
    : servicios;

  return (
    <div>
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar servicio…"
          className="w-full bg-bone-50 border border-bone-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-moss-400"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="col-span-2 text-sm text-ink-400 text-center py-4">
            Sin servicios
          </p>
        ) : (
          filtered.map((s) => {
            const active = selectedIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggle(s.id)}
                className={`text-left px-3 py-2.5 rounded-2xl border-2 text-sm transition-colors ${
                  active
                    ? "bg-moss-700 border-moss-700 text-white"
                    : "bg-white border-bone-200 hover:border-moss-300"
                }`}
              >
                <p className="font-semibold truncate">{s.nombre}</p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    active ? "text-bone-100" : "text-ink-500"
                  }`}
                >
                  {s.duracionEstimadaMinutos} min
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
