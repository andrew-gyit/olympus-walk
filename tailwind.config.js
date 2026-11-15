/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mars: {
          50: '#fff4ea',
          100: '#f8ddc8',
          200: '#eab894',
          300: '#d99163',
          400: '#c66e42',
          500: '#a9512e',
          600: '#8a3d24',
          700: '#672d1d',
          800: '#432018',
          900: '#261410',
          950: '#140b09'
        },
        ice: '#9fd8e8',
        signal: '#8ff0d2',
        warn: '#ffb35c',
        danger: '#ff6b57'
      },
      fontFamily: {
        display: ['Bahnschrift', 'DIN Alternate', 'Segoe UI', 'sans-serif'],
        mono: ['Consolas', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};
