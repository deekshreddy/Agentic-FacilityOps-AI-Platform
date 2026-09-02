module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1120',
        surface: '#111827',
        primary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        finance: '#8B5CF6',
      },
      boxShadow: {
        soft: '0 24px 80px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        xl: '1.5rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
