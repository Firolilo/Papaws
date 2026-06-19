import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { Label } from "./Field";

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: ComboOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  label,
  placeholder = "Selecciona…",
  disabled = false,
  searchPlaceholder = "Buscar…",
  emptyText = "Sin resultados",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Posición del menú flotante (se renderiza en un portal para no quedar recortado por
  // contenedores con overflow, p. ej. el cuerpo scrolleable de un modal).
  const [rect, setRect] = useState<DOMRect | null>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.hint ?? "").toLowerCase().includes(q)
      )
    : options;

  // Mantener la posición del menú sincronizada con el botón mientras está abierto.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      if (triggerRef.current) {
        setRect(triggerRef.current.getBoundingClientRect());
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  // ¿Abrir hacia arriba? Solo si abajo no entra y arriba hay más espacio.
  const espacioAbajo = rect ? window.innerHeight - rect.bottom : 0;
  const espacioArriba = rect ? rect.top : 0;
  const abrirArriba = rect != null && espacioAbajo < 240 && espacioArriba > espacioAbajo;
  // Alto máximo de la lista según el espacio disponible (deja un margen de 16px).
  const maxLista = Math.max(
    120,
    Math.min(288, (abrirArriba ? espacioArriba : espacioAbajo) - 72)
  );

  return (
    <div ref={rootRef} className="relative">
      {label && <Label>{label}</Label>}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 bg-white border-2 rounded-2xl px-4 py-2.5 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          open ? "border-moss-500" : "border-bone-200"
        }`}
      >
        <span
          className={`truncate ${selected ? "text-ink-700" : "text-ink-400"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[70] bg-white border-2 border-moss-200 rounded-2xl shadow-card overflow-hidden"
            style={{
              left: rect.left,
              width: rect.width,
              ...(abrirArriba
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
            }}
          >
            <div className="p-2 border-b border-bone-200">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-bone-50 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss-200"
                />
              </div>
            </div>
            <ul
              className="overflow-y-auto py-1"
              style={{ maxHeight: maxLista }}
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-ink-400 text-center">
                  {emptyText}
                </li>
              ) : (
                filtered.map((o) => {
                  const active = o.value === value;
                  return (
                    <li key={o.value}>
                      <button
                        type="button"
                        onClick={() => choose(o.value)}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                          active
                            ? "bg-moss-50 text-moss-800"
                            : "hover:bg-bone-50 text-ink-700"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {o.label}
                          </span>
                          {o.hint && (
                            <span className="block truncate text-[11px] text-ink-400">
                              {o.hint}
                            </span>
                          )}
                        </span>
                        {active && (
                          <Check size={15} className="shrink-0 text-moss-600" />
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
