/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C8A435',
          light: '#D9BB5E',
          lighter: '#E8D28C',
          dark: '#A9862A',
          deep: '#7A5F17',
        },
        ink: {
          DEFAULT: '#000000',
          900: '#050505',
          800: '#0A0A0A',
          700: '#111111',
          600: '#161616',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Space Grotesk', 'sans-serif'],
        display: ['var(--font-display)', 'Oswald', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 0 1px rgba(200,164,53,0.35), 0 8px 30px -6px rgba(200,164,53,0.35)',
        'gold-glow-lg': '0 0 0 1px rgba(200,164,53,0.45), 0 18px 60px -12px rgba(200,164,53,0.45)',
        'lift': '0 18px 40px -18px rgba(0,0,0,0.9)',
        'inner-hair': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'gold-sheen': 'linear-gradient(110deg, #A9862A 0%, #C8A435 35%, #E8D28C 50%, #C8A435 65%, #A9862A 100%)',
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.32'/%3E%3C/svg%3E\")",
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '400': '400ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(200, 164, 53, 0.55)' },
          '50%': { boxShadow: '0 0 0 10px rgba(200, 164, 53, 0)' },
        },
        'marquee-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-right': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'sheen': {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'scroll-hint': {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '40%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(10px)' },
        },
        'aurora': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.35' },
          '50%': { transform: 'translate3d(4%, -6%, 0) scale(1.15)', opacity: '0.6' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 1.8s ease-out infinite',
        'marquee-left': 'marquee-left 40s linear infinite',
        'marquee-right': 'marquee-right 40s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'sheen': 'sheen 1.1s ease-out',
        'float': 'float 5s ease-in-out infinite',
        'scroll-hint': 'scroll-hint 1.8s ease-in-out infinite',
        'aurora': 'aurora 14s ease-in-out infinite',
        'ticker': 'ticker 30s linear infinite',
      },
    },
  },
  plugins: [],
}
