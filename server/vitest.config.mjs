import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/tests/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    hookTimeout: 35000,
    testTimeout: 35000,
    fileParallelism: false,
  },
});
