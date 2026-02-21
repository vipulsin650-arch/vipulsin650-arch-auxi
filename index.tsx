
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * AgriSarthi - Style & Head Manager
 * Enhanced for high visibility and readability.
 */
const injectGlobalStyles = () => {
  if (!document.getElementById('tailwind-cdn')) {
    const tailwind = document.createElement('script');
    tailwind.id = 'tailwind-cdn';
    tailwind.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(tailwind);
  }

  if (!document.getElementById('google-fonts')) {
    const fonts = document.createElement('link');
    fonts.id = 'google-fonts';
    fonts.rel = 'stylesheet';
    fonts.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(fonts);
  }

  const metaTags = [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
    { name: 'theme-color', content: '#065f46' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
  ];
  
  metaTags.forEach(tag => {
    let element = document.querySelector(`meta[name="${tag.name}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('name', tag.name);
      document.head.appendChild(element);
    }
    element.setAttribute('content', tag.content);
  });

  const styleId = 'agrisarthi-global-css';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      :root {
        --ios-spring: cubic-bezier(0.2, 0.8, 0.2, 1);
        --bg-overlay: rgba(240, 253, 244, 0.95);
        --glass-bg: rgba(255, 255, 255, 0.8);
        --glass-border: rgba(255, 255, 255, 0.6);
        --theme-main: #064e3b;
        --theme-sub: #065f46;
        --body-bg: #f0fdf4;
      }

      body.dark-theme {
        --bg-overlay: rgba(2, 44, 34, 0.95);
        --glass-bg: rgba(0, 34, 25, 0.7);
        --glass-border: rgba(255, 255, 255, 0.1);
        --theme-main: #ecfdf5;
        --theme-sub: #d1fae5;
        --body-bg: #022c22;
      }

      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
        margin: 0;
        padding: 0;
        touch-action: manipulation;
        overflow: hidden;
        -webkit-font-smoothing: antialiased;
        color: var(--theme-main);
        background-color: var(--body-bg);
        transition: background-color 0.5s ease, color 0.5s ease;
      }

      /* Immersive Agriculture Background */
      .app-bg {
        position: fixed;
        inset: 0;
        background-image: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop');
        background-size: cover;
        background-position: center;
        z-index: -2;
      }

      .app-overlay {
        position: fixed;
        inset: 0;
        background: var(--bg-overlay);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: -1;
        transition: background 0.5s ease;
      }

      .glass-card {
        background: var(--glass-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--glass-border);
        box-shadow: 0 8px 32px 0 rgba(0, 40, 30, 0.1);
        transition: background 0.3s ease, border-color 0.3s ease;
      }

      .feature-card-img {
        position: relative;
        overflow: hidden;
        border-radius: 24px;
      }

      .feature-card-img::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.6));
      }

      h1, h2, h3, h4, b, strong {
        font-weight: 800 !important;
        letter-spacing: -0.02em;
      }
      
      p, span, select, input {
        font-weight: 600 !important;
      }

      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .ios-bg {
        background: transparent;
      }
    `;
    document.head.appendChild(style);
  }
};

injectGlobalStyles();

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <div className="app-bg"></div>
      <div className="app-overlay"></div>
      <App />
    </React.StrictMode>
  );
}
