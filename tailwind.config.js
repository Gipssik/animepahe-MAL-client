/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0d0d1a',
          secondary: '#13131f',
          card: '#1a1a2e',
          hover: '#1f1f35'
        },
        accent: {
          DEFAULT: '#7c6af7',
          hover: '#6a58e8',
          dim: '#7c6af720'
        },
        border: '#2a2a4a'
      }
    }
  },
  plugins: []
}
