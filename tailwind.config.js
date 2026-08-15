/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        postech: {
          DEFAULT: '#A61955',
          dark: '#8B1446',
          light: '#FFF0F5',
        },
        kaist: {
          DEFAULT: '#1487C8',
          dark: '#0E6DA3',
          light: '#EBF6FC',
        },
        gist: {
          DEFAULT: '#DF3128',
          light: '#FDF1F0',
        },
        dgist: {
          DEFAULT: '#0BBFF2',
          light: '#E8F9FE',
        },
        unist: {
          DEFAULT: '#001B54',
          light: '#E8EDF6',
        },
        kentech: {
          DEFAULT: '#00316C',
          light: '#EBF1F7',
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
