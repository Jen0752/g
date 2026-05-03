/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        re2: {
          dark: '#1a1a1a',
          accent: '#8b0000',
          text: '#e0e0e0',
        }
      }
    },
  },
  plugins: [],
}
