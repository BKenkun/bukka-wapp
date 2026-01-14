import { beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import dotenv from 'dotenv'
import path from 'path'

// Load test environment variables FIRST, before importing helpers
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

// Import helpers after env is loaded
import { prisma, cleanupDatabase } from './helpers'

beforeAll(async () => {
  // Ensure database is up to date with schema
  try {
    execSync('pnpm exec prisma db push', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'pipe',
    })
  } catch (error) {
    console.error('Failed to push database schema:', error)
    throw error
  }
})

beforeEach(async () => {
  // Clean database before each test for isolation
  await cleanupDatabase()
})

afterAll(async () => {
  await prisma.$disconnect()
})

export { prisma }
