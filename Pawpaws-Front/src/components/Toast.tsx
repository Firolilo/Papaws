import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

interface ToastData {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<
  ToastTone,
  { ring: string; icon: ReactNode; accent: string }
> = {
  success: {
    ring: "ring-moss-200",
    accent: "text-moss-700",
    icon: <CheckCircle2 size={18} className="text-moss-600" />,
  },
  error: {
    ring: "ring-clay-300/60",
    accent: "text-clay-600",
    icon: <AlertTriangle size={18} className="text-clay-500" />,
  },
  info: {
    ring: "ring-sun-400/50",
    accent: "text-ink-700",
    icon: <Info size={18} className="text-sun-500" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, message }]);
      // Auto-cierre: los éxitos son fugaces, los errores quedan un poco más.
      window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3800);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m) => show(m, "success"),
      error: (m) => show(m, "error"),
      info: (m) => show(m, "info"),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed z-[60] bottom-5 right-5 flex flex-col gap-2.5 w-[min(92vw,360px)] pointer-events-none">
        {toasts.map((t) => {
          const style = TONE_STYLES[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 bg-white rounded-2xl shadow-card border border-moss-100 ring-1 ${style.ring} px-4 py-3 animate-[toastIn_220ms_cubic-bezier(0.16,1,0.3,1)]`}
            >
              <span className="shrink-0 mt-0.5">{style.icon}</span>
              <p className={`flex-1 text-[13.5px] font-semibold leading-snug ${style.accent}`}>
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 -mr-1 -mt-0.5 p-1 rounded-lg text-ink-500/60 hover:text-ink-700 hover:bg-bone-100 transition-colors"
                aria-label="Cerrar"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(12px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  return ctx;
}
