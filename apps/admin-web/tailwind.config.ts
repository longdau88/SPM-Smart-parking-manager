import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          base: '#0B132B',
          surface: '#1C2541',
          elevated: '#243356',
          border: '#334155',
        },
        primary: {
          50: '#EFF6FF',
          500: '#3A86FF',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        accent: {
          cyan: '#00F5D4',
          cyanDark: '#00BB9C',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#0EA5E9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
