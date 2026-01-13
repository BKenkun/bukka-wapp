import path from "node:path"
import { defineConfig } from "prisma/config"
import { config } from "dotenv"

// Load .env.local for local development
config({ path: path.join(__dirname, ".env.local") })

export default defineConfig({
  schema: path.join(__dirname, "prisma/schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
  migrate: {
    adapter: async () => {
      const { PrismaPg } = await import("@prisma/adapter-pg")
      const { Pool } = await import("pg")
      // Use DIRECT_URL for migrations to avoid pgbouncer issues
      const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL })
      return new PrismaPg(pool)
    },
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
})
