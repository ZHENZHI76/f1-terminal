import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        neon: {
          "ferrari-red": "#ff2800",
          "redbull-blue": "#0600ef",
          "mclaren-orange": "#ff8000",
          "mercedes-silver": "#00d2be",
          "aston-green": "#006f62",
        },
      },
    },
  },
  plugins: [],
};
export default config;
