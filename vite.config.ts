import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

function copyInstallHtml() {
  return {
    name: 'copy-install-html',
    closeBundle() {
      fs.copyFileSync(resolve(__dirname, 'install.html'), resolve(__dirname, 'dist/install.html'));
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3007',
            changeOrigin: true,
          }
        }
      },
      plugins: [react(), copyInstallHtml()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || 'AIzaSyC5Lfm4-ntpJ8riTpLjexqbmJwmcbuAfHs'),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || 'AIzaSyC5Lfm4-ntpJ8riTpLjexqbmAfHs'),
        'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
