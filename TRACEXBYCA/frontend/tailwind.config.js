/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "var(--bg-base)",
          900: "var(--bg-surface)",
          800: "var(--bg-elevated)",
          700: "var(--border-subtle)",
          600: "var(--border-strong)",
        },
        cyan: {
          intel: "var(--color-brand)",
          dim: "var(--color-brand-dim)",
        },
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        cyber: {
          blue: "#2563eb",
          indigo: "#4f46e5",
          cyan: "#06b6d4",
          teal: "#0d9488",
          emerald: "#10b981",
          amber: "#f59e0b",
          slate: "#0f172a",
        },
      },
      boxShadow: {
        cyber: "0 4px 20px -2px rgba(37, 99, 235, 0.15)",
        "cyber-sm": "0 2px 8px -1px rgba(37, 99, 235, 0.12)",
        "cyber-glow": "0 0 15px rgba(37, 99, 235, 0.35)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Segoe UI", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["IBM Plex Mono", "Consolas", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
