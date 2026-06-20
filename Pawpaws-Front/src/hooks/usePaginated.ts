import { useEffect, useMemo, useState } from "react";

/**
 * Pagina del lado del cliente una lista ya cargada/filtrada.
 * - Muestra `pageSize` elementos por página (10 por defecto).
 * - Se reinicia a la página 1 cuando cambian los filtros (pasá su valor en `resetKey`).
 * - Mantiene la página dentro de un rango válido si la lista se acorta.
 */
export function usePaginated<T>(items: T[], pageSize = 10, resetKey?: unknown) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  // Cambió el filtro → volvemos al inicio.
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  // La lista se acortó por debajo de la página actual → la ajustamos.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const start = (page - 1) * pageSize;
  const pageItems = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize]
  );

  return { page, setPage, pageCount, pageItems, total: items.length, start };
}
