// Pruebas de extremo a extremo (E2E) con Playwright sobre la versión web de la app.
// Ejecutar: npm run test:e2e  (levanta "expo start --web" si no está corriendo)
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8081';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'tests/e2e/reporte', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'es-CL',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'movil', use: { ...devices['Pixel 7'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npx expo start --web --port 8081',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
