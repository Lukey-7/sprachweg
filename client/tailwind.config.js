/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        der: {
          DEFAULT: '#2563eb', // Blue
          light: '#dbeafe',
          dark: '#1e40af',
          text: '#1d4ed8'
        },
        die: {
          DEFAULT: '#dc2626', // Red
          light: '#fee2e2',
          dark: '#991b1b',
          text: '#b91c1c'
        },
        das: {
          DEFAULT: '#16a34a', // Green
          light: '#dcfce7',
          dark: '#166534',
          text: '#15803d'
        },
        plural: {
          DEFAULT: '#9333ea', // Purple
          light: '#f3e8ff',
          dark: '#6b21a8',
          text: '#7e22ce'
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
