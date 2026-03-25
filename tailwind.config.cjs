/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Segoe UI Variable Display"', '"Trebuchet MS"', "sans-serif"],
        body: ['"Segoe UI Variable Text"', '"Gill Sans"', "sans-serif"]
      },
      colors: {
        abyss: {
          950: "#07111f",
          900: "#102038",
          800: "#173055"
        },
        ember: {
          500: "#ff8a3d",
          400: "#ffab5c",
          300: "#ffc46b"
        },
        tide: {
          500: "#42c6cf",
          400: "#6adfe6",
          300: "#a2f2f6"
        },
        dawn: {
          100: "#fff4de",
          200: "#f7e0b2"
        }
      },
      boxShadow: {
        panel: "0 24px 70px rgba(4, 12, 24, 0.35)"
      },
      keyframes: {
        floatin: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        floatin: "floatin 0.45s ease-out"
      }
    }
  },
  plugins: []
};
