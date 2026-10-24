import type { Config } from "tailwindcss";

/** Admin app (src/) + hub-ui sources. Never sites/ or templates/ — those are engine-rendered. */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/hub-ui/src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
