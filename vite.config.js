import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';

// Dev-only plugin: start the API server (server.js) alongside Vite so a single
// `vite` (or `npm run dev`) boots the whole app. The server exits quietly if its
// port is already in use, so this is safe even if another launcher started it.
function apiServerPlugin() {
  let child = null;
  return {
    name: 'start-api-server',
    apply: 'serve',
    configureServer() {
      child = spawn(process.execPath, ['server.js'], { stdio: 'inherit' });
      const stop = () => {
        if (child) {
          child.kill();
          child = null;
        }
      };
      process.on('exit', stop);
      process.on('SIGINT', () => { stop(); process.exit(); });
      process.on('SIGTERM', () => { stop(); process.exit(); });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiServerPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
