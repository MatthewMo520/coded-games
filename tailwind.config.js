/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          825: '#1e2530',
          850: '#1a202c',
        },
        pastel: {
          blue: '#E1F5FE',
          lightBlue: '#F0F8FF',
          green: '#E8F5E8',
          lightGreen: '#F1F8E9',
          red: '#FFEBEE',
          lightRed: '#FFF5F5',
          yellow: '#FFFDE7',
          lightYellow: '#FEFBF0',
          purple: '#F3E5F5',
          lightPurple: '#F8F4FF',
          pink: '#FCE4EC',
          lightPink: '#FFF0F5',
          orange: '#FFF3E0',
          lightOrange: '#FFF8F0',
          cyan: '#E0F7FA',
          lightCyan: '#F0FDFF',
        }
      }
    },
  },
  plugins: [],
}