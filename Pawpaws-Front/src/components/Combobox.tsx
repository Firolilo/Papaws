import { useEffect, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.hint ?? "").toLowerCase().includes(q)
      )
    : options;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={rootRef} className="relative">
      {label && <Label>{label}</Label>}
      <button
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

      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border-2 border-moss-200 rounded-2xl shadow-card overflow-hidden">
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
          <ul className="max-h-56 overflow-y-auto py-1">
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
        </div>
      )}
    </div>
  );
}
