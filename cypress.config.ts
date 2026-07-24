import { defineConfig } from 'cypress';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:3001',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    defaultCommandTimeout: 12000,
    requestTimeout: 15000,
    viewportWidth: 1280,
    viewportHeight: 800,
    setupNodeEvents(on, config) {
      return config;
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {
        plugins: [react()],
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
            '@common': path.resolve(__dirname, './src/components/common'),
            '@services': path.resolve(__dirname, './src/services'),
            '@utils': path.resolve(__dirname, './src/utils'),
          },
        },
      },
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    indexHtmlFile: 'cypress/support/component-index.html',
  },
});
