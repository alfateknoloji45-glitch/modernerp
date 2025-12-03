/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sidebar-bg': '#0f172a', // Koyu Lacivert
        'sidebar-hover': '#1e293b',
        'accent': '#3b82f6',      // Mavi
        'bg-light': '#f1f5f9',    // Açık Gri Zemin
      }
    },
  },
  plugins: [],
}
