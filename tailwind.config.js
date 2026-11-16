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
      // Fluid UI type scale. `--u` (src/index.css) is 1px at 1366 wide and grows to 1.2px at 1920,
      // so a 12 * --u label is 12px on a laptop and ~14px on a Full HD monitor.
      // ui-* replaces the old text-[6..13px] arbitrary sizes (too small to read on desktop).
      fontSize: {
        'ui-2xs': ['calc(11 * var(--u))', { lineHeight: '1.35' }],
        'ui-xs': ['calc(12 * var(--u))', { lineHeight: '1.4' }],
        'ui-sm': ['calc(13 * var(--u))', { lineHeight: '1.4' }],
        'ui-md': ['calc(14 * var(--u))', { lineHeight: '1.4' }],
        'ui-lg': ['calc(15 * var(--u))', { lineHeight: '1.4' }],
        'ui-xl': ['calc(16 * var(--u))', { lineHeight: '1.4' }],
        'ui-2xl': ['calc(18 * var(--u))', { lineHeight: '1.35' }],
        xs: ['calc(12 * var(--u))', { lineHeight: '1.5' }],
        sm: ['calc(14 * var(--u))', { lineHeight: '1.5' }],
        base: ['calc(16 * var(--u))', { lineHeight: '1.5' }],
        lg: ['calc(18 * var(--u))', { lineHeight: '1.45' }],
        xl: ['calc(20 * var(--u))', { lineHeight: '1.35' }],
        '2xl': ['calc(24 * var(--u))', { lineHeight: '1.25' }],
      },
      fontFamily: {
        display: ['Bahnschrift', 'DIN Alternate', 'Segoe UI', 'sans-serif'],
        mono: ['Consolas', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};
