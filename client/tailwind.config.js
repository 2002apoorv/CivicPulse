/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        civic: {
          bg: '#f8fafc',
          surface: '#ffffff',
          border: '#e2e8f0',
          muted: '#64748b',
          text: '#0f172a',
          teal: '#0d9488',
          amber: '#d97706',
          rose: '#e11d48'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Mukta', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        hindi: ['Mukta', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
