/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Valorant brand colors
        valorant: {
          red: '#FF4655',
          blue: '#0F1419',
          dark: '#0F1419',
          darker: '#0A0E13',
          gray: {
            50: '#F7F8F8',
            100: '#ECE8DA',
            200: '#C89B3C',
            300: '#8B7B71',
            400: '#5A5A5A',
            500: '#383838',
            600: '#2A2A2A',
            700: '#1E1E1E',
            800: '#1A1A1A',
            900: '#0F1419',
          },
          gold: '#C89B3C',
          green: '#34C759',
        }
      },
      fontFamily: {
        'valorant': ['Tungsten', 'Arial', 'sans-serif'],
        'din': ['DIN Next', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px #FF4655' },
          '50%': { boxShadow: '0 0 20px #FF4655, 0 0 30px #FF4655' },
        },
      },
    },
  },
  plugins: [],
}