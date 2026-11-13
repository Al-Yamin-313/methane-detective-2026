/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spaceBlack: '#0B1426',
        deepSpaceBlack: '#0E1A30',
        deepSpace: '#142240',
        panelBg: '#1A2C50',
        panelBorder: '#2F4D7E',
        subtleBlue: '#4A6AA0',
        accent: '#7CC4FF',
        accentGlow: '#A0D6FF',
        methane: '#FF8A4F',
        methaneGlow: '#FFB088',
        warning: '#FFCE5C',
        success: '#7CF0BC',
      },
      fontFamily: {
        manrope: ['Manrope', 'Inter', 'sans-serif'],
        orbitron: ['Manrope', 'Inter', 'sans-serif'], // Corporate typography aliased for complete design consistency
        heading: ['Manrope', 'Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        bengali: ['"Noto Sans Bengali"', '"Hind Siliguri"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
