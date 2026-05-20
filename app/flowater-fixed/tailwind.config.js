/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '375px',   // Small phones (iPhone SE, Galaxy A series)
      'sm': '640px',   // Large phones / small tablets
      'md': '768px',   // Tablets
      'lg': '1024px',  // Laptops / large tablets
      'xl': '1280px',  // Desktops
      '2xl': '1536px', // Large desktops
      '3xl': '1920px', // Ultra-wide / 4K
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      maxWidth: {
        'screen-3xl': '1920px',
      },
      spacing: {
        'safe-top':    'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left':   'env(safe-area-inset-left)',
        'safe-right':  'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
}
