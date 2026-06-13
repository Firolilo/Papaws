import { ReactNode } from "react";
import { PawIcon } from "./Logo";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-moss-100 rounded-xl2 shadow-soft ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-20 px-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-clay-50 flex items-center justify-center mb-5 ring-8 ring-clay-50/40">
        <PawIcon size={28} color="#ff8d75" />
      </div>
      <p className="font-hand text-2xl text-clay-500 leading-none mb-1">
        oh, vacío…
      </p>
      <h3 className="font-display text-2xl text-moss-800">{title}</h3>
      <p className="text-sm text-ink-500 mt-2 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="relative">
        <div className="w-8 h-8 border-[3px] border-moss-100 border-t-moss-600 rounded-full animate-spin" />
      </div>
      <p className="font-hand text-lg text-clay-500">cargando huellitas…</p>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-clay-50 border border-clay-300/50 text-clay-600 rounded-2xl px-4 py-3 text-sm font-semibold">
      {message}
    </div>
  );
}
