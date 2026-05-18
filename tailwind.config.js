/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'deep-charcoal': "var(--deep-charcoal)",
        'soft-sage': "var(--soft-sage)",
        'pure-white': "var(--pure-white)",
        'pixie-teal': "var(--pixie-teal)",
        'pixie-teal-hover': "var(--pixie-teal-hover)",
        'primary-accent': "var(--primary-accent)",
        'primary-accent-hover': "var(--primary-accent-hover)",
        'text-muted': "var(--text-muted)",
      },
      borderRadius: {
        'bento': "var(--radius-bento)",
        'pill': "var(--radius-pill)",
        'inner': "var(--radius-inner)",
      },
      boxShadow: {
        'bento': "var(--shadow-bento)",
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
};
