import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        clash: ['Clash Display', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        tan: "#E6B98D",
        brown: "#8B5E3C",
        "feature-green": "#7A9E7E",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Cores customizadas do projeto
        'bora-blue': {
          DEFAULT: '#006BA6',
          '50': '#E6F4FA',
          '100': '#CCE9F5',
          '200': '#99D3EB',
          '300': '#66BCE1',
          '400': '#33A6D7',
          '500': '#006BA6',
          '600': '#005585',
          '700': '#004064',
          '800': '#002A42',
          '900': '#001521',
        },
        'bora-red': {
          DEFAULT: '#E31E24',
          '50': '#fef2f2',
          '100': '#fee2e2',
          '200': '#fecaca',
          '300': '#fca5a5',
          '400': '#f87171',
          '500': '#ef4444',
          '600': '#E31E24',
          '700': '#b91c1c',
          '800': '#991b1b',
          '900': '#7f1d1d',
        },
        'bora-yellow': {
          DEFAULT: '#FFD700',
          '50': '#fffbeb',
          '100': '#fef3c7',
          '200': '#fde68a',
          '300': '#fcd34d',
          '400': '#fbbf24',
          '500': '#f59e0b',
          '600': '#FFD700',
          '700': '#a16207',
          '800': '#854d0e',
          '900': '#713f12',
        },
        'bora-orange': {
          DEFAULT: '#FF6B00',
          '50': '#FFF7ED',
          '100': '#FFEDD5',
          '200': '#FED7AA',
          '300': '#FDBA74',
          '400': '#FB923C',
          '500': '#F97316',
          '600': '#EA580C',
          '700': '#C2410C',
          '800': '#9A3412',
          '900': '#7C2D12',
        },
        navy: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
          dark: '#020617',
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-out-scale": {
          "0%": { opacity: "1", transform: "scale(1) translateY(0)" },
          "100%": { opacity: "0", transform: "scale(0.8) translateY(-10px)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "custom-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
        "aurora": {
          "0%": { transform: "translateX(0%) hue-rotate(0deg)" },
          "50%": { transform: "translateX(-10%) hue-rotate(10deg)" },
          "100%": { transform: "translateX(0%) hue-rotate(0deg)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out-scale": "fade-out-scale 0.5s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "custom-bounce": "custom-bounce 1s ease-in-out infinite",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 3s infinite",
        "aurora": "aurora 20s infinite linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;