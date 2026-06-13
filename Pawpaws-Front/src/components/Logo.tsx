export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      {/* Huellita formando corazón en rusty_spice */}
      <path
        d="M32 56 C 14 44, 8 32, 14 22 C 19 14, 28 16, 32 24 C 36 16, 45 14, 50 22 C 56 32, 50 44, 32 56 Z"
        fill="#bb3e03"
      />
      <g fill="#fbf7ed">
        <circle cx="22" cy="26" r="3" />
        <circle cx="42" cy="26" r="3" />
        <circle cx="17" cy="33" r="2.5" />
        <circle cx="47" cy="33" r="2.5" />
        <ellipse cx="32" cy="38" rx="6" ry="5" />
      </g>
    </svg>
  );
}

export function PawIcon({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <circle cx="6" cy="8" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="4.5" cy="14" r="1.8" />
      <circle cx="19.5" cy="14" r="1.8" />
      <ellipse cx="12" cy="16.5" rx="4.5" ry="4" />
    </svg>
  );
}
