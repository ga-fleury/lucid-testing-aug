// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import react from '@astrojs/react';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare({
    // Explicitly enable KV bindings
    mode: 'advanced',
    functionPerRoute: false,
    platformProxy: {
      enabled: true,
    }
  }),
  integrations: [react(), svelte()],
  vite: {
    resolve: {
      // Use react-dom/server.edge instead of react-dom/server.browser for React 19.
      // Without this, MessageChannel from node:worker_threads needs to be polyfilled.
      alias: import.meta.env.PROD ? {
        "react-dom/server": "react-dom/server.edge",
      } : undefined,
    },
  },
  base: '/lucid',
  build: {
    assetsPrefix: '/lucid',
  },
  trailingSlash: 'ignore',
  output: 'server',
  server: {
    port: 4321,
    host: true
  }
});