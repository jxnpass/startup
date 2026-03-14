const { defineConfig } = require('vite');

module.exports = defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  build: {
    outDir: 'service/public',
    emptyOutDir: true,
  },
});
