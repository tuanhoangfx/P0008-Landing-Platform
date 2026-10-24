// Admin app only — engine builds pass an inline PostCSS config (engine/site.mjs), so this never reaches sites.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
