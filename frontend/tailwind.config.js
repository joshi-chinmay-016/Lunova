/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="night"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          DEFAULT: 'var(--surface-1)',
        },
        line: 'var(--line)',
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          glow: 'var(--accent-glow)',
        },
        evidence: {
          DEFAULT: 'var(--evidence)',
          soft: 'var(--evidence-soft)',
        },
        gap: {
          DEFAULT: 'var(--gap)',
          soft: 'var(--gap-soft)',
        },
        info: {
          DEFAULT: 'var(--info)',
          soft: 'var(--info-soft)',
        },
      },
      fontFamily: {
        sans: ['var(--font-roboto)', 'Roboto', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'Roboto Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        'accent-glow': '0 0 16px -2px var(--accent-glow)',
        'evidence-glow': '0 0 16px -2px rgba(79, 209, 181, 0.2)',
        'gap-glow': '0 0 16px -2px rgba(255, 122, 102, 0.2)',
      },
    },
  },
  plugins: [],
};
