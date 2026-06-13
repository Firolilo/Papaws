import { ReactNode } from "react";

type Tone = "moss" | "clay" | "neutral" | "amber" | "red" | "blue" | "sun";

const tones: Record<Tone, string> = {
  moss: "bg-moss-100 text-moss-800 ring-moss-200/70",
  clay: "bg-clay-100 text-clay-600 ring-clay-300/40",
  neutral: "bg-bone-200 text-ink-700 ring-ink-400/15",
  amber: "bg-sun-300 text-sun-500 ring-sun-400/40",
  red: "bg-clay-100 text-clay-600 ring-clay-300/60",
  blue: "bg-moss-50 text-moss-700 ring-moss-200/60",
  sun: "bg-sun-300 text-ink-700 ring-sun-400/40",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Plaquita tipo collar - con agujerito */
export function CollarTag({
  children,
  tone = "moss",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`relative inline-flex items-center gap-1 pl-4 pr-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ring-1 ${tones[tone]}`}
    >
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white ring-1 ring-current/30" />
      {children}
    </span>
  );
}

export function estadoTone(estado: string): Tone {
  switch (estado) {
    case "Pendiente":
      return "sun";
    case "Confirmada":
      return "blue";
    case "Cancelada":
      return "red";
    case "Completada":
      return "moss";
    default:
      return "neutral";
  }
}
