/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [
    // Custom scrollbar utilities
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin'
        },
        '.scrollbar-thumb-gray-700::-webkit-scrollbar': {
          width: '6px'
        },
        '.scrollbar-thumb-gray-700::-webkit-scrollbar-thumb': {
          'background-color': '#374151',
          'border-radius': '9999px'
        }
      });
    }
  ]
};

