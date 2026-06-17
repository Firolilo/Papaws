import { ReactNode, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { ErrorBox } from "./Card";

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  onConfirm,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />
      <div className="relative w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-card border border-moss-100 p-7">
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              tone === "danger"
                ? "bg-clay-50 text-clay-500"
                : "bg-moss-50 text-moss-700"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-2xl text-moss-800 leading-tight">
              {title}
            </h2>
            <div className="text-sm text-ink-500 mt-1.5 leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorBox message={error} />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={confirm}
            disabled={loading}
          >
            {loading ? "Procesando…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
