import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 35000,
    testTimeout: 35000,
    fileParallelism: false,
  },
});
