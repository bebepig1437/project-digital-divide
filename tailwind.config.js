/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — pulled from the PDD logo + proposal doc
        navy: {
          DEFAULT: '#1E3A5F',
          50: '#EEF3F8',
          100: '#D6E2ED',
          700: '#27496F',
          800: '#1E3A5F',
          900: '#16314F',
          950: '#0F2236',
        },
        teal: {
          DEFAULT: '#2E9D94',
          400: '#4FBDB0',
          500: '#3AAFA4',
          600: '#2E9D94',
          700: '#247E77',
        },
        cream: '#FAF8F3',
        ink: '#1E293B',
        muted: '#64748B',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(120deg, #1E3A5F 0%, #2E9D94 60%, #4FBDB0 100%)',
      },
      maxWidth: {
        content: '72rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
    },
  },
  plugins: [],
}
