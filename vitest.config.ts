import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    setupFiles: ['__tests__/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'app/api/**/*.ts'],
      exclude: [
        'node_modules',
        '__tests__',
        '**/*.d.ts',
        'lib/uploadthing.ts', // External service config
        'lib/mux/**/*.ts', // External service
      ],
    },
    pool: 'forks',
    isolate: false, // Run tests sequentially to avoid DB conflicts
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
