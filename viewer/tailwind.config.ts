import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0d5c63",
        accent: "#e07a5f",
        teal: "#4a9d7c",
        deceased: "#d94f4f",
        "border-light": "#ede8e0",
        surface: "#faf9f7",
        "surface-muted": "#f0ede8",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(to right, #0d5c63, #14919b)",
        "gradient-teal": "linear-gradient(to right, #4a9d7c, #6bb89d)",
        "gradient-gold": "linear-gradient(to right, #d4a574, #e8c9a0)",
        "gradient-accent": "linear-gradient(to right, #e07a5f, #f2a98e)",
      },
    },
  },
  plugins: [],
};

export default config;