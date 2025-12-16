/* eslint-env node */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wellness & Clarity Theme - Revamped for Soft UI
        primary: {
            DEFAULT: '#1f2937', // Softer dark gray for text
            foreground: '#ffffff',
        },
        background: '#f8fafc', // Very light blue-gray for background
        surface: '#ffffff',     // Pure white for cards
        muted: '#94a3b8',       // Slate 400
        
        // Soft Pastel Accents for Data Cards (Refined)
        wellness: {
            blue: '#e0f7fa',    // Cyan 50
            lavender: '#f3e8ff', // Purple 100
            green: '#dcfce7',   // Green 100
            peach: '#ffedd5',   // Orange 100
            rose: '#ffe4e6',    // Rose 100
            mint: '#ccfbf1',    // Teal 100
            indigo: '#e0e7ff',  // Indigo 100
        },

        accent: {
          DEFAULT: '#374151', 
          hover: '#4b5563',
          light: '#f1f5f9', // Slate 100
        },
        // Semantic colors
        success: '#34d399', // Emerald 400 (Softer)
        error: '#f87171',   // Red 400 (Softer)
        warning: '#fbbf24', // Amber 400
      },
      fontFamily: {
        sans: ['"Outfit"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.05)',
        'soft-hover': '0 20px 40px -10px rgba(0,0,0,0.08)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
        'glow': '0 0 20px rgba(220, 252, 231, 0.5)', 
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
