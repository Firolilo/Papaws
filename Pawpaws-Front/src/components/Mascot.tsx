export function Mascot({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      aria-hidden
      className="animate-float"
    >
      {/* orejas */}
      <ellipse
        cx="46"
        cy="50"
        rx="18"
        ry="26"
        fill="#003b46"
        transform="rotate(-22 46 50)"
      />
      <ellipse
        cx="114"
        cy="50"
        rx="18"
        ry="26"
        fill="#003b46"
        transform="rotate(22 114 50)"
      />
      <ellipse
        cx="46"
        cy="54"
        rx="10"
        ry="18"
        fill="#fda880"
        transform="rotate(-22 46 54)"
      />
      <ellipse
        cx="114"
        cy="54"
        rx="10"
        ry="18"
        fill="#fda880"
        transform="rotate(22 114 54)"
      />
      {/* cara */}
      <ellipse cx="80" cy="92" rx="50" ry="46" fill="#005f73" />
      {/* mejillas */}
      <circle cx="44" cy="106" r="9" fill="#fc7c41" opacity="0.85" />
      <circle cx="116" cy="106" r="9" fill="#fc7c41" opacity="0.85" />
      {/* ojos */}
      <ellipse cx="60" cy="86" rx="6" ry="8" fill="#001219" />
      <ellipse cx="100" cy="86" rx="6" ry="8" fill="#001219" />
      <circle cx="58" cy="83" r="2" fill="#ffffff" />
      <circle cx="98" cy="83" r="2" fill="#ffffff" />
      {/* hocico */}
      <ellipse cx="80" cy="108" rx="14" ry="10" fill="#fbf7ed" />
      <ellipse cx="80" cy="103" rx="4" ry="3" fill="#001219" />
      {/* boquita */}
      <path
        d="M70 113 Q80 122 90 113"
        stroke="#001219"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* corazón flotante */}
      <g transform="translate(132 38)" className="animate-wiggle">
        <path
          d="M0 8 C -6 2, -10 -4, -4 -8 C 0 -10, 0 -4, 0 -4 C 0 -4, 0 -10, 4 -8 C 10 -4, 6 2, 0 8 Z"
          fill="#bb3e03"
        />
      </g>
    </svg>
  );
}
