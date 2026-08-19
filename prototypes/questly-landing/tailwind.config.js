/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#080909',
          elevated: '#0d0f0e',
          panel: '#131615',
          surface: '#191c1a',
        },
        fg: {
          DEFAULT: '#e8ebe7',
          muted: '#7a8078',
          dim: '#525750',
        },
        accent: {
          DEFAULT: '#c7ff2f',
          dim: 'rgba(199, 255, 47, 0.10)',
          mid: 'rgba(199, 255, 47, 0.20)',
        },
        danger: {
          DEFAULT: '#f06b6b',
          dim: 'rgba(240, 107, 107, 0.12)',
        },
        info: '#3b82f6',
        signal: {
          fail: '#f59e0b',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.07)',
          strong: 'rgba(255, 255, 255, 0.13)',
          accent: 'rgba(199, 255, 47, 0.25)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
