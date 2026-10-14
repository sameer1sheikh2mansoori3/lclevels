import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cf: {
          gray: "#808080",
          green: "#00a900",
          cyan: "#03a89e",
          blue: "#0000ff",
          purple: "#aa00aa",
          orange: "#ff8c00",
          red: "#ff0000",
          legendary: "#cc0000",
        },
      },
    },
  },
  plugins: [],
};
export default config;
