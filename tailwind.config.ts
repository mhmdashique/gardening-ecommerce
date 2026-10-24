import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f2f8f4",
          100: "#e2f0e7",
          200: "#c5e0ce",
          300: "#9bc8ac",
          400: "#6ba985",
          500: "#478b65",
          600: "#34704f",
          700: "#2a5941",
          800: "#234836",
          900: "#1c3b2d",
          950: "#0e2119",
        },
        leaf: {
          DEFAULT: "#1f4d3a",
          deep: "#12382a",
          ink: "#0d2a20",
          soft: "#e9f4ec",
          mint: "#f4faf5",
          cream: "#fbfaf5",
          sage: "#dcebdd",
        },
        ink: "#1b2b24",
        muted: "#66786d",
        line: "#e2ebe4",
        amber: { DEFAULT: "#e9a23b", soft: "#fdf3df", ink: "#8a5606" },
        sky: { DEFAULT: "#3d7edb", soft: "#e8f1fe", ink: "#1f4f93" },
        violet: { DEFAULT: "#7c5cd6", soft: "#f0ecfd", ink: "#523a9b" },
        success: { DEFAULT: "#2f9e62", soft: "#e7f6ec", ink: "#1c6c42" },
        danger: { DEFAULT: "#c0442f", soft: "#fdeeea", ink: "#8d2c1c" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Fraunces", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18, 56, 42, 0.04), 0 12px 32px -16px rgba(18, 56, 42, 0.18)",
        lift: "0 18px 48px -20px rgba(18, 56, 42, 0.35)",
        soft: "0 8px 30px -18px rgba(18, 56, 42, 0.28)",
      },
      maxWidth: { shell: "1440px" },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s ease-out both",
        "fade-in": "fade-in .3s ease-out both",
        "slide-in": "slide-in .28s cubic-bezier(.22,1,.36,1) both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
