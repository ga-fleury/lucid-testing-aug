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
    functionPerRoute: false
  }),
  integrations: [react(), svelte()],
  base: '/lucid',
  trailingSlash: 'ignore',
  output: 'server',
  server: {
    port: 4321,
    host: true
  }
});