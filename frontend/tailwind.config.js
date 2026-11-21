/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Cereza de café madura: color principal de la marca (botones, acentos).
        brand: {
          50: '#fcf3f1',
          100: '#f9e2dd',
          200: '#f1c2b8',
          300: '#e5978a',
          400: '#d4675a',
          500: '#bf4436',
          600: '#a5322a',
          700: '#872822',
          800: '#6d2320',
          900: '#5a201e',
        },
        // Café tostado oscuro: menú lateral y fondos profundos.
        espresso: {
          50: '#f6f1ee',
          100: '#e9ded7',
          200: '#d3bdb0',
          300: '#b49582',
          400: '#8f6c58',
          500: '#6e4f3f',
          600: '#563c31',
          700: '#432f27',
          800: '#33231d',
          900: '#241813',
          950: '#170f0b',
        },
        // Crema de leche: fondo general de la aplicación.
        crema: {
          50: '#fdfaf5',
          100: '#f8f1e6',
          200: '#efe2cc',
          300: '#e3cda9',
        },
        // Dorado de pan dulce: detalles y resaltados.
        oro: {
          100: '#fbefd0',
          300: '#f0cf7a',
          400: '#e6b84d',
          500: '#d29f2c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
