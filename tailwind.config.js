/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      gridTemplateColumns: {
        'auto-fill-180': 'repeat(auto-fill, minmax(180px, 1fr))',
        'auto-fill-280': 'repeat(auto-fill, minmax(280px, 1fr))',
      },
      scale: {
        '102': '1.02',
      },
      height: {
        '45': '180px',
      },
    },
  },
  plugins: [],
};