/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Reuse the CSS variables from index.css
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        sans: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
      },
    },
  },
  plugins: [],
}
