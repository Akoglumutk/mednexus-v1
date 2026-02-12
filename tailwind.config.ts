import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // tailwind.config.ts
  theme: {
    extend: {
      colors: {
        background: "#050505", // Saf Siyah (Zemin)
        paper: "#121212",      // Çok Koyu Gri (Kartlar)
        gold: "#D4AF37",       // Antik Altın (Vurgu)
        crimson: "#991B1B",    // Koyu Kırmızı (Uyarı/Önemli)
        ember: "#F59E0B",      // Kehribar (High Yield Akkoru)
        medText: "#E5E7EB",    // Parlak Gri (Okunabilirlik)
        medMuted: "#6B7280",   // Sönük Gri
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
};
export default config;