/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        body: ['Fira Sans Condensed']
      }
    },
  },
  plugins: [require('tailwind-scrollbar')],
}

