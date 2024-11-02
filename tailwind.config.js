/** @type {import('tailwindcss').Config} */

const {nextui} = require("@nextui-org/theme");

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",

    './node_modules/@nextui-org/theme/dist/components/slider.js'
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [nextui()],
}
