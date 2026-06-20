import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** Total de elementos, para el texto "Mostrando X–Y de N". */
  total?: number;
  pageSize?: number;
  className?: string;
}

// Devuelve los números de página a mostrar, con "…" para los tramos ocultos.
function buildRange(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const range: (number | "…")[] = [1];
  const inicio = Math.max(2, page - 1);
  const fin = Math.min(pageCount - 1, page + 1);
  if (inicio > 2) range.push("…");
  for (let i = inicio; i <= fin; i++) range.push(i);
  if (fin < pageCount - 1) range.push("…");
  range.push(pageCount);
  return range;
}

export function Pagination({
  page,
  pageCount,
  onChange,
  total,
  pageSize = 10,
  className = "",
}: Props) {
  if (pageCount <= 1) return null;

  const numeros = buildRange(page, pageCount);
  const desde = (page - 1) * pageSize + 1;
  const hasta = total != null ? Math.min(total, page * pageSize) : page * pageSize;

  const btnBase =
    "inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-full text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 ${className}`}
    >
      {total != null && (
        <p className="text-xs text-ink-500">
          Mostrando <strong>{desde}</strong>–<strong>{hasta}</strong> de{" "}
          <strong>{total}</strong>
        </p>
      )}
      <nav className="flex items-center gap-1 sm:ml-auto" aria-label="Paginación">
        <button
          type="button"
          className={`${btnBase} text-moss-700 hover:bg-moss-50`}
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {numeros.map((n, i) =>
          n === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-1.5 text-ink-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={`${btnBase} ${
                n === page
                  ? "bg-moss-700 text-white shadow-soft"
                  : "text-moss-700 hover:bg-moss-50"
              }`}
            >
              {n}
            </button>
          )
        )}

        <button
          type="button"
          className={`${btnBase} text-moss-700 hover:bg-moss-50`}
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
