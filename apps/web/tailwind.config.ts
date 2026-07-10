import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF3FB',
          100: '#D6E2F5',
          200: '#A8C4E8',
          300: '#7FA3D9',
          500: '#2C5FA8',
          600: '#1E5499',
          700: '#17458F',
          800: '#103570',
          900: '#0B2A5C',
        },
        accent: {
          50: '#FFF7E8',
          100: '#FEEFCC',
          200: '#FDE099',
          300: '#FCCF6E',
          500: '#F7A81B',
          600: '#D48E0F',
          700: '#B87A0C',
        },
        neutral: {
          0: '#FFFFFF',
          50: '#FAFAF9',
          100: '#F1F1EF',
          400: '#94A3B8',
          700: '#334155',
          900: '#0F172A',
        },
      },
      fontFamily: {
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(11, 42, 92, 0.08)',
        lift: '0 12px 40px -8px rgba(11, 42, 92, 0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
