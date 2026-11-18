/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F7F6F2',
        canvas: '#F7F6F2',
        ink: {
          DEFAULT: '#171817',
          light: '#2D302D',
          muted: '#747570',
        },
        muted: '#747570',
        line: '#DCDDD6',
        accent: {
          DEFAULT: '#315CE8',
          soft: '#E8EDFF',
          hover: '#254BC8',
          active: '#1D3FA8',
        },
        brand: {
          DEFAULT: '#315CE8',
          hover: '#254BC8',
          active: '#1D3FA8',
          subtle: '#E8EDFF',
          border: '#C7D4FC',
        },
        slate: {
          DEFAULT: '#747570',
          muted: '#8D8E88',
          light: '#B2B4AB',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#EFEFEA',
          tertiary: '#E5E6DF',
        },
        border: {
          DEFAULT: '#DCDDD6',
          subtle: '#DCDDD6',
          strong: '#C4C6BD',
        },
        dark: {
          DEFAULT: '#171A20',
          surface: '#22262E',
          card: '#1C2028',
          border: '#2C323D',
          muted: '#8B92A0',
        },
        primary: {
          50: '#F0F3FE',
          100: '#E8EDFF',
          200: '#C7D4FC',
          300: '#9FB5FA',
          400: '#6487F3',
          500: '#315CE8',
          600: '#254BC8',
          700: '#1D3FA8',
          800: '#173385',
          900: '#12255F',
        },
      },
      fontFamily: {
        sans: ['var(--font-roboto)', 'Roboto', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        serif: ['var(--font-roboto)', 'Roboto', 'sans-serif'],
        display: ['var(--font-roboto)', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        'elevated': '0 4px 6px -1px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.05)',
        'premium': '0 12px 32px -4px rgba(16, 24, 40, 0.08), 0 4px 12px -2px rgba(16, 24, 40, 0.03)',
        'card': '0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.04)',
        'clay-card': '0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        'clay-hover': '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 12px 28px -4px rgba(15, 23, 42, 0.09), inset 0 1px 0 rgba(255, 255, 255, 1)',
        'clay-elevated': '0 10px 30px -4px rgba(15, 23, 42, 0.10), 0 4px 12px -2px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        'clay-button': '0 2px 4px rgba(70, 88, 217, 0.2), 0 4px 12px -2px rgba(70, 88, 217, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        'clay-inset': 'inset 0 1px 3px rgba(15, 23, 42, 0.06), inset 0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.625rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      }
    },
  },
  plugins: [],
};
