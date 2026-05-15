import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "saudi-green": "#0a7c47",
        "saudi-green-dark": "#075c35",
        "alert-red": "#dc2626",
      },
      fontFamily: {
        arabic: ["Tajawal", "IBM Plex Sans Arabic", "sans-serif"],
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        "pulse-ring-fast": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(3)", opacity: "0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "emergency-bg": {
          "0%, 100%": { backgroundColor: "#dc2626" },
          "50%": { backgroundColor: "#991b1b" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.5s ease-out infinite",
        "pulse-ring-fast": "pulse-ring-fast 0.8s ease-out infinite",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "emergency-bg": "emergency-bg 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
