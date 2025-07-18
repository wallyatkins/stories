/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
      },
      colors: {
        coral: '#FF7F50',
        teal: '#008080',
        gold: '#FFD700',
        'nav-bg': '#2E2E2E', // A dark, warm gray for the nav
      },
    },
  },
  plugins: [],
};

