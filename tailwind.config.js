/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light theme colors
        light: {
          bg: {
            primary: '#ffffff',
            card: 'rgba(253, 251, 251, 0.74)',
            'card-hover': 'rgba(253, 251, 251, 0.9)',
            alt: '#f0f0f0',
            selected: '#e7f3ff',
          },
          text: {
            primary: '#333',
            secondary: '#555',
            muted: '#666',
            heading: '#152d97',
            'heading-secondary': '#0f1574',
          },
          border: {
            DEFAULT: '#e0e0e0',
            input: '#e0e0e0',
            'input-focus': '#667eea',
            selected: '#667eea',
          },
          button: {
            bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            hover: 'rgba(102, 126, 234, 0.4)',
          },
          stat: {
            bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          },
          tab: {
            active: '#667eea',
            hover: '#667eea',
          },
          star: {
            active: '#15b8ff',
            inactive: '#c7d4df',
          },
        },
        // Dark theme colors (default)
        dark: {
          bg: {
            primary: '#0f172a',
            card: 'rgba(30, 30, 46, 0.95)',
            'card-hover': 'rgba(40, 40, 56, 0.95)',
            alt: 'rgba(50, 50, 66, 0.7)',
            selected: 'rgba(124, 158, 255, 0.2)',
          },
          text: {
            primary: '#e0e0e0',
            secondary: '#c0c0c0',
            muted: '#a0a0a0',
            heading: '#7c9eff',
            'heading-secondary': '#9bb5ff',
          },
          border: {
            DEFAULT: '#404060',
            input: '#404060',
            'input-focus': '#7c9eff',
            selected: '#7c9eff',
          },
          button: {
            bg: 'linear-gradient(135deg, #7c9eff 0%, #9bb5ff 100%)',
            hover: 'rgba(124, 158, 255, 0.4)',
          },
          stat: {
            bg: 'linear-gradient(135deg, #7c9eff 0%, #9bb5ff 100%)',
          },
          tab: {
            active: '#7c9eff',
            hover: '#9bb5ff',
          },
          star: {
            active: '#5fe9ff',
            inactive: '#2a3b4d',
          },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        'gradient-light': 'linear-gradient(135deg, #961414 0%, #00000000 100%)',
        'gradient-button-dark': 'linear-gradient(135deg, #7c9eff 0%, #9bb5ff 100%)',
        'gradient-button-light': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-stat-dark': 'linear-gradient(135deg, #7c9eff 0%, #9bb5ff 100%)',
        'gradient-stat-light': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      borderWidth: {
        3: '3px',
      },
      maxWidth: {
        content: '1400px',
      },
      width: {
        '9/10': '90%',
      },
      boxShadow: {
        theme: '0 4px 6px rgba(0, 0, 0, 0.3)',
        'theme-hover': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'button-hover': '0 4px 12px rgba(124, 158, 255, 0.4)',
        'soft-dark': '0 25px 60px rgba(15, 23, 42, 0.45)',
        'soft-blue': '0 30px 65px rgba(59, 130, 246, 0.35)',
        'soft-light': '0 25px 55px rgba(148, 163, 184, 0.45)',
        'soft-light-strong': '0 30px 70px rgba(148, 163, 184, 0.55)',
      },
    },
  },
  plugins: [],
}

