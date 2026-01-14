import dotenv from 'dotenv'
import path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

// This is a minimal setup file that loads env vars for all tests
// Database setup is handled by integration/setup.ts for integration tests only
