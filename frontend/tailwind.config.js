/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        foreground: '#FFFFFF',
        accent: {
          DEFAULT: '#2B6EF2',
          dark: '#1E4FB3',
          light: '#5B8DF5'
        },
        muted: '#0F1524',
        card: '#0E1422',
        border: '#1C2333'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
};


