/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'gh-dark': '#0d1117',
        'gh-surface': '#161b22',
        'gh-border': '#30363d',
        'gh-text': '#e6edf3',
        'gh-muted': '#7d8590',
        'gh-green': '#39d353',
        'gh-green-dim': '#0e4429',
      },
    },
  },
  plugins: [],
}

