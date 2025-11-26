/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base monochrome palette (Sketchpad aesthetic)
        background: "#ffffff",
        foreground: "#000000",
        muted: "#f4f4f5", // zinc-100
        border: "#000000",
        // Status colors (high saturation)
        "status-delay": "#facc15", // yellow-400
        "status-cancel": "#ef4444", // red-500
        "status-on-time": "#22c55e", // green-500
      },
      borderWidth: {
        DEFAULT: "2px",
      },
      borderRadius: {
        DEFAULT: "0.125rem", // rounded-sm
        none: "0",
        sm: "0.125rem",
      },
      boxShadow: {
        sharp: "4px 4px 0px 0px rgba(0, 0, 0, 1)",
        "sharp-sm": "2px 2px 0px 0px rgba(0, 0, 0, 1)",
      },
      fontFamily: {
        mono: [
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};





