/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6F0FC',
          100: '#CCE0F9',
          200: '#99C2F3',
          300: '#66A3EE',
          400: '#3385E8',
          500: '#0166E0',
          600: '#0152B3',
          700: '#013D86',
          800: '#01295A',
          900: '#00142D',
        },
        shopee: '#ee4d2d',
        lazada: '#3b82f6', // Lighter blue for dark mode readability
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'jenosize-hero': "url('/hero-bg.webp')",
        'jenosize-dots': "url('/dot-bg.webp')",
      },
    },
  },
  plugins: [],
};
