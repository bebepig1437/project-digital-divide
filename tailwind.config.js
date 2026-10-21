/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Authoritative Brand Palette
        brand: {
          slate: '#1A5C75', // Deep Slate Blue (Primary structural, dark cards, deep text)
          teal: '#278693',  // Mid Teal (Secondary accent, borders, hover tones)
          cyan: '#46C0A9',  // Vibrant Cyan-Teal (Action highlights, active badges, focus rings)
          white: '#FFFFFF', // Pristine White (Crisp surface cards, typography)
          pale: '#A3E8DE',  // Pale Cyan (Soft tint backgrounds, subtle containers)
        },
        navy: {
          DEFAULT: '#1A5C75',
          50: '#F0F8FA',
          100: '#E0F1F4',
          700: '#226D87',
          800: '#1A5C75',
          900: '#134659',
          950: '#0C2D3A',
        },
        teal: {
          DEFAULT: '#278693',
          300: '#A3E8DE',
          400: '#46C0A9',
          500: '#278693',
          600: '#1F6F7A',
          700: '#17565F',
        },
        pale: '#A3E8DE',
        cream: '#FAF8F5',

        // Semantic theme tokens, backed by CSS variables that swap under `html.dark`.
        // See src/index.css for the variable values per theme.
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        wash: 'rgb(var(--c-wash) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        raised: 'rgb(var(--c-raised) / <alpha-value>)',
        heading: 'rgb(var(--c-heading) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        hero: 'rgb(var(--c-hero) / <alpha-value>)',
        heroMuted: 'rgb(var(--c-hero-muted) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #143a56 0%, #185573 20%, #1c7385 40%, #269699 60%, #37bba5 80%, #4eccb0 100%)',
        'brand-subtle': 'linear-gradient(180deg, #FFFFFF 0%, #F0F8FA 100%)',
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
