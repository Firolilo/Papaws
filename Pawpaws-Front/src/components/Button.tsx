import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap rounded-full";

const variants: Record<Variant, string> = {
  primary:
    "bg-moss-700 text-white hover:bg-moss-800 active:scale-[0.97] shadow-soft hover:shadow-card",
  secondary:
    "bg-white text-moss-800 hover:bg-moss-50 ring-1 ring-moss-200",
  ghost: "text-moss-700 hover:bg-moss-50",
  danger: "bg-clay-500 text-white hover:bg-clay-600 shadow-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[14px]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", icon, className = "", children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
});
