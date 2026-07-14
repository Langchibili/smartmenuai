import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Core brown/espresso palette
        espresso: {
          950: "#0D0400",
          900: "#1C0A00",
          800: "#2D1200",
          700: "#3B1A06",
          600: "#4F240A",
          500: "#6B3318",
          400: "#8B4A28",
          300: "#A06030",
        },
        // Primary amber-brown
        amber: {
          50:  "#FFF8ED",
          100: "#FEF0D4",
          200: "#FCD9A0",
          300: "#F9BE62",
          400: "#F59E24",
          500: "#D4850A",
          600: "#A0622A",
          700: "#7C4A1E",
          800: "#5A3315",
          900: "#3B200C",
        },
        // Beer gold accent
        gold: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#F5C842",
          500: "#D4A017",
          600: "#A07A0A",
          700: "#785A06",
          800: "#503C04",
          900: "#2D2202",
        },
        // Cream text
        cream: {
          50:  "#FFFDF9",
          100: "#FDF8F0",
          200: "#F9EDD8",
          300: "#F2D9B8",
          400: "#E8C194",
          500: "#D4A872",
          600: "#B88856",
          700: "#8B6038",
          800: "#5F3E22",
          900: "#3A2212",
        },
        // Status colors
        success: "#22C55E",
        warning: "#F59E0B",
        danger:  "#EF4444",
        info:    "#3B82F6",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        // Core gradients
        "brand-gradient":   "linear-gradient(135deg, #D4850A 0%, #A0622A 50%, #6B3318 100%)",
        "dark-gradient":    "linear-gradient(180deg, #1C0A00 0%, #0D0400 100%)",
        "card-gradient":    "linear-gradient(145deg, #2D1200 0%, #1C0A00 100%)",
        "gold-shimmer":     "linear-gradient(90deg, transparent 0%, #F5C842 50%, transparent 100%)",
        "amber-glow":       "radial-gradient(ellipse at top, #D4850A22 0%, transparent 70%)",
        "sidebar-top":      "linear-gradient(180deg, #D4850A 0%, #A0622A 30%, transparent 100%)",
        "hero-overlay":     "linear-gradient(180deg, transparent 0%, #0D0400 100%)",
        "glass-surface":    "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        "brand":      "0 4px 24px rgba(212, 133, 10, 0.3)",
        "brand-lg":   "0 8px 48px rgba(212, 133, 10, 0.4)",
        "card":       "0 2px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.6)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.5), 0 4px 12px rgba(212,133,10,0.15)",
        "glow":       "0 0 20px rgba(212,133,10,0.5), 0 0 60px rgba(212,133,10,0.2)",
        "glow-sm":    "0 0 10px rgba(212,133,10,0.4)",
        "inset-brand": "inset 0 1px 0 rgba(212,133,10,0.2)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "fade-in":      "fadeIn 0.3s ease-out",
        "slide-up":     "slideUp 0.4s ease-out",
        "slide-in-left":"slideInLeft 0.3s ease-out",
        "pulse-brand":  "pulseBrand 2s ease-in-out infinite",
        "shimmer":      "shimmer 2s infinite",
        "float":        "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:      { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:     { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideInLeft: { from: { opacity: "0", transform: "translateX(-16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        pulseBrand:  { "0%,100%": { boxShadow: "0 0 10px rgba(212,133,10,0.3)" }, "50%": { boxShadow: "0 0 30px rgba(212,133,10,0.7)" } },
        shimmer:     { "0%": { backgroundPosition: "-200%" }, "100%": { backgroundPosition: "200%" } },
        float:       { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
    },
  },
  plugins: [],
};

export default config;
