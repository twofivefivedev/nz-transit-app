/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("nativewind/preset"), require("@metlink/ui/tailwind.config")],
  theme: {
    extend: {},
  },
  plugins: [],
};


