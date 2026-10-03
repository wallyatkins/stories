/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Quicksand', 'sans-serif'],
      },
      colors: {
        coral: {
          DEFAULT: '#FF7F50',
          light: '#ff9770',
          dark: '#e0663a',
        },
        teal: {
          DEFAULT: '#008080',
          400: '#2dd4bf',
          500: '#008080',
          light: '#20b2aa',
          dark: '#006666',
        },
        gold: {
          DEFAULT: '#FFD700',
          light: '#ffe44d',
          dark: '#cca300',
        },
        'nav-bg': '#2E2E2E',
        dark: {
          bg: '#0a0a0a',
          surface: '#151515',
          raised: '#1d1d1d',
          elevated: '#242424',
          active: '#2d2d2d',
          border: '#2a2a2a',
          muted: '#888888',
        },
      },
    },
  },
  plugins: [],
};
