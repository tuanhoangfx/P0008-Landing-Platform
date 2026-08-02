/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        hair: {
          primary: "#f36e36",
          accent: "#e01a1a",
          gold: "#ef9300",
          highlight: "#fde298",
          ink: "#363636",
          muted: "#6d6d6d",
          surface: "#f3f4f5",
        },
      },
      fontFamily: {
        sans: [
          "Be Vietnam Pro",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        display: ["K2D", "Be Vietnam Pro", "sans-serif"],
        tagline: ["Arima", "Georgia", "serif"],
      },
      maxWidth: {
        landing: "420px",
      },
      boxShadow: {
        cta: "0 4px 14px rgba(243, 110, 54, 0.45)",
        sticky: "0 -2px 12px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};
