/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d1117",
        surface: "#161b22",
        border: "#30363d",
        primary: "#238636",
        accent: "#58a6ff",
        warning: "#d29922",
        danger: "#f85149"
      }
    },
  },
  plugins: [],
}
