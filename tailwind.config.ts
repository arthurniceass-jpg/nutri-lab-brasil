import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1360px" },
    },
    extend: {
      colors: {
        // Identidade NUTRI LAB BRASIL
        // ink e lime sao constantes da marca (nao mudam com o tema).
        ink: "#0A0A0A",
        lime: {
          DEFAULT: "#C2EE3E",
          dark: "#A6D424",
          glow: "#D4FF52",
        },
        // Superficies e textos vem de variaveis CSS (trocam entre night/evening).
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "#C2EE3E",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        carbon: "hsl(var(--carbon) / <alpha-value>)",
        steel: "hsl(var(--steel) / <alpha-value>)",
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        primary: { DEFAULT: "#C2EE3E", foreground: "#0A0A0A" },
        destructive: { DEFAULT: "#EF4444", foreground: "#FAFAFA" },
        success: { DEFAULT: "#22C55E", foreground: "#0A0A0A" },
        warning: { DEFAULT: "#F59E0B", foreground: "#0A0A0A" },
      },
      fontFamily: {
        display: ["var(--font-anton)", "Impact", "sans-serif"],
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-lime": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(194,238,62,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(194,238,62,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "slide-in": "slide-in 0.3s ease-out both",
        "pulse-lime": "pulse-lime 2s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
