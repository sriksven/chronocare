/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif Pro"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        bg: '#f8f6f1',
        paper: '#ffffff',
        ink: {
          DEFAULT: '#0e1622',
          2: '#2a3447',
          3: '#5a6478',
        },
        rule: '#e5e0d4',
        teal: {
          DEFAULT: '#1a5762',
          deep: '#0f3a44',
          soft: '#d4e5e8',
        },
        accent: '#1a5762',
        muted: '#73798a',
        risk: {
          low: '#19704a',
          med: '#a86c14',
          high: '#9c2f2f',
        },
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
