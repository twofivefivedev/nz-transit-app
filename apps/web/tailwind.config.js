/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("@metlink/ui/tailwind.config")],
  theme: {
    extend: {},
  },
  plugins: [],
};





