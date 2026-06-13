/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // bone = base. Blanco puro + cremas/aguas muy claras
        bone: {
          50: "#ffffff",
          100: "#fbf7ed", // vanilla_custard.900
          200: "#e9f6f2", // pearl_aqua.900
          300: "#bee4d7", // pearl_aqua.700 - bordes claros
        },
        // moss = teal/cyan primario (dark_teal + dark_cyan + pearl_aqua)
        moss: {
          50: "#e9f6f2", // pearl_aqua.900
          100: "#d4ede5", // pearl_aqua.800
          200: "#bee4d7", // pearl_aqua.700
          300: "#94d2bd", // pearl_aqua DEFAULT
          400: "#3f977a", // pearl_aqua.300
          500: "#0a9396", // dark_cyan DEFAULT
          600: "#087577", // dark_cyan.400
          700: "#005f73", // dark_teal DEFAULT (primario)
          800: "#004e5e", // dark_teal.400
          900: "#001219", // ink_black DEFAULT
        },
        // clay = óxido cálido (acento - calidez/corazón)
        clay: {
          50: "#fee0c2", // burnt_caramel.900
          100: "#fed3c0", // rusty_spice.900
          200: "#fda880", // rusty_spice.800
          300: "#fc7c41", // rusty_spice.700
          400: "#ca6702", // burnt_caramel DEFAULT
          500: "#bb3e03", // rusty_spice DEFAULT
          600: "#ae2012", // oxidized_iron DEFAULT
          700: "#9b2226", // brown_red DEFAULT
        },
        // sun = vainilla + dorado
        sun: {
          100: "#fbf7ed", // vanilla.900
          200: "#f2e7c9", // vanilla.700
          300: "#e9d8a6", // vanilla DEFAULT
          400: "#ee9b00", // golden_orange DEFAULT
          500: "#ca6702", // burnt_caramel DEFAULT
        },
        ink: {
          400: "#5a6068",
          500: "#353b42",
          700: "#181c22",
          900: "#001219",
        },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
        display: ["Fredoka", "Nunito", "system-ui", "sans-serif"],
        hand: ["Caveat", "cursive"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,18,25,0.05), 0 12px 32px -16px rgba(0,18,25,0.14)",
        card: "0 2px 6px -2px rgba(0,18,25,0.08), 0 18px 40px -24px rgba(0,18,25,0.16)",
        ring: "0 0 0 1px rgba(0,95,115,0.10)",
      },
      borderRadius: {
        xl2: "1.5rem",
      },
    },
  },
  plugins: [],
};
