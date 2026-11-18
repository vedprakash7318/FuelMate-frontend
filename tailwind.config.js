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
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        petrol: {
          light: '#fed7aa',
          DEFAULT: '#ea580c',
          dark: '#c2410c',
        },
        diesel: {
          light: '#bbf7d0',
          DEFAULT: '#059669',
          dark: '#047857',
        }
      },
      boxShadow: {
        'mobile': '0 -4px 20px -2px rgba(0, 0, 0, 0.08), 0 -2px 6px -2px rgba(0, 0, 0, 0.04)',
        'app': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 10px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
