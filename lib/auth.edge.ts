import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

/**
 * Auth instance for Edge runtime (proxy/middleware)
 * This uses only JWT validation, no database calls
 */
export const { auth } = NextAuth(authConfig)
