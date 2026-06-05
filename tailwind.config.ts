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
        background: "var(--bg)",
        foreground: "var(--ivory)",
        // Remap archive tokens to new warm design system values to ensure compatibility
        "archive-charcoal": "var(--bg)",
        "archive-surface": "var(--surface)",
        "archive-surface2": "var(--surface2)",
        "archive-border": "var(--border)",
        "archive-ivory": "var(--ivory)",
        "archive-brass": "var(--gold)",
        "archive-brass-dim": "rgba(184, 151, 74, 0.15)",
        // Explicitly name the new design tokens
        "persist-bg": "var(--bg)",
        "persist-surface": "var(--surface)",
        "persist-surface2": "var(--surface2)",
        "persist-border": "var(--border)",
        "persist-ivory": "var(--ivory)",
        "persist-aged": "var(--aged)",
        "persist-seal": "var(--seal)",
        "persist-gold": "var(--gold)",
        "persist-moss": "var(--moss)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
