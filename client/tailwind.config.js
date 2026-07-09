/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#141414',
        surface: '#181818',
        surface2: '#232323',
        surface3: '#2f2f2f',
        border: '#333333',
        text: '#F5F5F7',
        muted: '#808080',
        accent: {
          DEFAULT: '#E50914',
          hover: '#C11119',
          dim: '#470003',
        },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
