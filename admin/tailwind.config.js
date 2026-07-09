/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0D10',
        surface: '#14171C',
        surface2: '#1C2027',
        surface3: '#242933',
        border: '#262B33',
        text: '#E8EAED',
        muted: '#8B92A0',
        accent: {
          DEFAULT: '#E5342E',
          hover: '#FF4438',
          dim: '#5A1613',
        },
        live: '#2FBF71',
        processing: '#E5A93E',
        draft: '#5C6370',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};
