/** @type {import('tailwindcss').Config} */
// Brand palette — keep in sync with app/providers.jsx (AntD tokens) and
// app/globals.css (:root CSS vars). See design-system/MASTER.md.
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5E7D26", // AA on white; AntD colorPrimary
          bright: "#98C441", // historical brand lime — accents only
          50: "#F6FAEC",
          100: "#EAF3D3",
          200: "#D7E8AC",
          300: "#C0DB7F",
          400: "#ACCF5B",
          500: "#98C441",
          600: "#7FA836",
          700: "#5E7D26",
          800: "#48611D",
          900: "#384C16",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
