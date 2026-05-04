/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        re2: {
          dark: '#f8f9fb',      // 极简白/浅灰白背景
          accent: '#4a90d9',     // 低饱和度蓝
          text: '#2d3748',       // 深灰文字
          subtle: '#e2e8f0',     // 浅灰分隔线
          muted: '#94a3b8',      // 柔和次要文字
          card: '#ffffff',       // 纯白卡片
          overlay: 'rgba(248, 249, 251, 0.85)', // 半透明白
        }
      },
      fontFamily: {
        sans: ['"Source Han Sans"', '"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'lifted': '0 8px 24px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'btn': '6px',
      },
    },
  },
  plugins: [],
}