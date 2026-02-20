import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    environment: 'node',
    // Use // @vitest-environment jsdom at top of .test.tsx files that need DOM.
  },
  resolve: {
    alias: [
      { find: /^@\/features\//, replacement: fileURLToPath(new URL('./src/features/', import.meta.url)) },
      { find: /^@\/domain\//, replacement: fileURLToPath(new URL('./src/domain/', import.meta.url)) },
      { find: /^@\/server\//, replacement: fileURLToPath(new URL('./src/server/', import.meta.url)) },
      { find: /^@\/shared\//, replacement: fileURLToPath(new URL('./src/shared/', import.meta.url)) },
      { find: '@', replacement: root },
    ],
  },
});
