/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wuwa-dark': '#0f172a',
        'electric-blue': '#00d2ff',
        'wuwa-yellow': '#facc15',
      }
    },
  },
  plugins: [],
}
