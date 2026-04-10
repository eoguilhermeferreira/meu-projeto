import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        keni: {
          black: '#0a0a0a',
          white: '#ffffff',
          red: {
            primary: '#e5000a',
            dark: '#a80007',
            light: '#ff4d55',
          },
        },
      },
      fontFamily: {
        display: ['var(--keni-font-display)', 'Arial Black', 'sans-serif'],
        heading: ['var(--keni-font-heading)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['var(--keni-font-body)', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      screens: {
        xs: '375px',
        sm: '480px',
        md: '720px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1366px',
        '3xl': '1536px',
      },
    },
  },
  plugins: [],
}

export default config
