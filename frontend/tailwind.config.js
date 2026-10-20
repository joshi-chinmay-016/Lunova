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
        canvas: '#F4F5F7',
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#EEF0F3',
          tertiary: '#E5E8EC',
        },
        border: {
          subtle: '#E2E5E9',
          strong: '#D1D5DB',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        content: {
          primary: '#1F2937',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'clay-card': '0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        'clay-hover': '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 12px 28px -4px rgba(15, 23, 42, 0.09), inset 0 1px 0 rgba(255, 255, 255, 1)',
        'clay-elevated': '0 10px 30px -4px rgba(15, 23, 42, 0.10), 0 4px 12px -2px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        'clay-button': '0 2px 4px rgba(37, 99, 235, 0.2), 0 4px 12px -2px rgba(37, 99, 235, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        'clay-inset': 'inset 0 1px 3px rgba(15, 23, 42, 0.06), inset 0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      }
    },
  },
  plugins: [],
};
