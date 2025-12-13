/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wellness & Clarity Theme
        primary: {
            DEFAULT: '#111827', // Gray 900
            foreground: '#ffffff',
        },
        background: '#f9fafb', // Gray 50 (Calm/Neutral)
        surface: '#ffffff',
        muted: '#9ca3af', // Gray 400
        
        // Soft Pastel Accents for Data Cards
        wellness: {
            blue: '#e0f2fe',    // Sky 100
            lavender: '#f3e8ff', // Purple 100
            green: '#dcfce7',   // Green 100
            peach: '#ffedd5',   // Orange 100
            rose: '#nffe4',  // Rose 100
            mint: '#ccfbf1',    // Teal 100
        },

        accent: {
          DEFAULT: '#1f2937', // Gray 800 (Active State)
          hover: '#374151',
          light: '#f3f4f6', // Gray 100
        },
        // Semantic colors
        success: '#10b981', // Emerald 500
        error: '#ef4444', // Red 500
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(0, 0, 0, 0.1)',
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
