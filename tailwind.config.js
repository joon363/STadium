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
          DEFAULT: '#C80036',
          dark: '#A0002B',
          light: '#FFF0F3',
        },
        kaist: {
          DEFAULT: '#004182',
          dark: '#002E5D',
          light: '#E6F0FA',
        },
        gist: {
          DEFAULT: '#F37023',
          light: '#FFF3EB',
        },
        dgist: {
          DEFAULT: '#0088CC',
          light: '#E6F5FC',
        },
        unist: {
          DEFAULT: '#002855',
          light: '#E6ECF5',
        },
        kentech: {
          DEFAULT: '#1D6740',
          light: '#EAF3ED',
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
