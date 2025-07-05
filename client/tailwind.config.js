/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dojo: {
          primary: '#1f2937',
          secondary: '#374151',
          accent: '#fbbf24',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          white: '#fef7cd',
          yellow: '#fde047',
          orange: '#fb923c',
          green: '#22c55e',
          blue: '#3b82f6',
          brown: '#a3a3a3',
          black: '#111827'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}