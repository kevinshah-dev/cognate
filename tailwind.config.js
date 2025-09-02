/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1a1b26',
        'dark-bg-secondary': '#24283b',
        'dark-card': '#1f202e',
        'dark-border': '#414868',
        'dark-text': '#c0caf5',
        'dark-text-secondary': '#a9b1d6',
        'accent-blue': '#7aa2f7',
        'accent-green': '#9ece6a',
        'accent-red': '#f7768e',
      }
    },
  },
  plugins: [],
}

