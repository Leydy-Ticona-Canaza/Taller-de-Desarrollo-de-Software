/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A47B8",
          dark: "#0B1F4F",
          light: "#3B6FE0",
          softer: "#E8EEFB",
        },
        accent: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
          light: "#FBBF24",
        },
        silver: "#94A3B8",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        star: "#FBBF24",
        "estado-pendiente": "#F59E0B",
        "estado-aceptada": "#1A47B8",
        "estado-proceso": "#7C3AED",
        "estado-finalizada": "#16A34A",
        "estado-cancelada": "#DC2626",
        "estado-rechazada": "#78716C",
      },
      boxShadow: {
        soft: "0 4px 14px 0 rgba(11, 31, 79, 0.08)",
        card: "0 6px 24px -8px rgba(11, 31, 79, 0.18)",
        glow: "0 10px 30px -10px rgba(26, 71, 184, 0.55)",
        "glow-accent": "0 10px 30px -10px rgba(245, 158, 11, 0.55)",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at 20% 20%, rgba(59, 111, 224, 0.45) 0%, transparent 55%), radial-gradient(circle at 85% 15%, rgba(245, 158, 11, 0.25) 0%, transparent 50%), linear-gradient(135deg, #0B1F4F 0%, #1A47B8 100%)",
        "brand-gradient":
          "linear-gradient(135deg, #0B1F4F 0%, #1A47B8 50%, #3B6FE0 100%)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(2deg)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 10px 30px -10px rgba(245, 158, 11, 0.55)",
          },
          "50%": {
            boxShadow: "0 14px 40px -8px rgba(245, 158, 11, 0.85)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.08)" },
          "66%": { transform: "translate(-20px, 25px) scale(0.95)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "spin-reverse": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "wrench-wiggle": {
          "0%, 100%": { transform: "rotate(-12deg)" },
          "25%": { transform: "rotate(8deg)" },
          "50%": { transform: "rotate(-8deg)" },
          "75%": { transform: "rotate(14deg)" },
        },
        "check-pop": {
          "0%": { transform: "scale(0) rotate(-45deg)", opacity: "0" },
          "50%": { transform: "scale(1.25) rotate(0deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        spark: {
          "0%": {
            transform: "translate(0, 0) scale(1)",
            opacity: "1",
          },
          "100%": {
            transform: "translate(var(--tx, 0), var(--ty, 0)) scale(0)",
            opacity: "0",
          },
        },
        bounce_in: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "shake-x": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-8px)" },
          "40%, 80%": { transform: "translateX(8px)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out both",
        "fade-in": "fade-in 0.5s ease-out both",
        "slide-in-right": "slide-in-right 0.6s ease-out both",
        "scale-in": "scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        float: "float 4s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "gradient-shift": "gradient-shift 8s ease-in-out infinite",
        blob: "blob 12s ease-in-out infinite",
        "spin-slow": "spin-slow 14s linear infinite",
        "spin-reverse": "spin-reverse 10s linear infinite",
        "spin-medium": "spin-slow 4s linear infinite",
        "spin-medium-reverse": "spin-reverse 3s linear infinite",
        "wrench-wiggle": "wrench-wiggle 1.8s ease-in-out infinite",
        "check-pop": "check-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        spark: "spark 0.9s ease-out forwards",
        "bounce-in": "bounce_in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "shake-x": "shake-x 0.5s cubic-bezier(.36,.07,.19,.97) both",
      },
    },
  },
  plugins: [],
};
