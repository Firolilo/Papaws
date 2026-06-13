import { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="font-hand text-2xl text-clay-500 leading-none mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[44px] sm:text-[54px] text-moss-800 leading-[1.02]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-ink-500 text-[15px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
