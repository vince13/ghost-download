import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ghostScenarios } from './src/data/ghost-scenarios.js';

const ghostSimPlugin = () => ({
  name: 'ghost-sim-middleware',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api/ghost-sim')) {
        next();
        return;
      }

      (async () => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');

        const url = new URL(req.url, 'http://localhost');
        const mode = url.searchParams.get('mode') ?? 'sales';
        const events = ghostScenarios[mode] ?? ghostScenarios.sales;

        for (const event of events) {
          await new Promise((resolve) => setTimeout(resolve, event.delay));
          res.write(`${JSON.stringify(event.payload)}\n`);
        }

        res.end();
      })().catch((error) => {
        console.error('Ghost sim middleware failed', error);
        res.statusCode = 500;
        res.end('Ghost sim error');
      });
    });
  }
});

// We use a different base path for Electron builds so that assets
// are referenced with relative URLs when loaded via file://.
// - Web / Vercel builds: base '/app/'
// - Electron builds:     base './'
export default defineConfig(({ mode }) => {
  const isElectronBuild = mode === 'electron';

  return {
    base: isElectronBuild ? './' : '/app/',
    plugins: [react(), ghostSimPlugin()],
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        // Proxy API calls to Vercel deployment in development
        // Handle both /api and /app/api (due to base path)
        '^/api': {
          target: 'https://ghost-green.vercel.app',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/app/, '') // Remove /app prefix if present
        },
        '^/app/api': {
          target: 'https://ghost-green.vercel.app',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/app/, '') // Remove /app prefix
        }
      }
    },
    build: {
      outDir: 'dist'
    }
  };
});


