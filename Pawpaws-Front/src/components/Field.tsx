import {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const baseControl =
  "w-full bg-white border-2 border-bone-200 rounded-2xl px-4 py-2.5 text-ink-700 placeholder:text-ink-400 focus:border-moss-500 focus:bg-white transition-all";

export function Label({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between px-1">
      <label className="text-[12px] font-bold uppercase tracking-wider text-moss-700">
        {children}
      </label>
      {hint && (
        <span className="text-[11px] text-ink-500 font-mono">{hint}</span>
      )}
    </div>
  );
}

export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }
) {
  const { label, hint, className = "", ...rest } = props;
  return (
    <div>
      {label && <Label hint={hint}>{label}</Label>}
      <input className={`${baseControl} ${className}`} {...rest} />
    </div>
  );
}

export function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, className = "", ...rest } = props;
  return (
    <div>
      {label && <Label>{label}</Label>}
      <textarea
        rows={3}
        className={`${baseControl} resize-none ${className}`}
        {...rest}
      />
    </div>
  );
}

export function Select(
  props: SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    children: ReactNode;
  }
) {
  const { label, children, className = "", ...rest } = props;
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select className={`${baseControl} pr-8 ${className}`} {...rest}>
        {children}
      </select>
    </div>
  );
}
