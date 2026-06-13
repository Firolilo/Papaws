import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: "md" | "lg";
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-[fadeIn_150ms_ease]"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${widths[size]} bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-card border border-moss-100 max-h-[92vh] flex flex-col`}
      >
        <header className="flex items-start justify-between gap-4 px-7 pt-7 pb-4 border-b border-moss-100">
          <div>
            <p className="font-hand text-xl text-clay-500 leading-none mb-1">
              hagamos esto
            </p>
            <h2 className="font-display text-2xl text-moss-800">{title}</h2>
            {subtitle && (
              <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mt-1 -mr-1 rounded-lg text-ink-500 hover:bg-moss-100/60"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>
        <div className="px-6 py-5 overflow-y-auto scroll-stable">{children}</div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
