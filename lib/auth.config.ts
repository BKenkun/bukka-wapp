import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { type JWT } from "next-auth/jwt"

/**
 * Auth config for Edge runtime (proxy/middleware)
 * This file must NOT import Prisma or any Node.js-only modules
 */

interface SubscriptionPlanData {
  id: string
  slug: string
  name: string
  level: number
  maxVideoQuality: string
  canComment: boolean
  canAccessForum: boolean
  canDownload: boolean
  canAccessExclusive: boolean
  canAccessLimitedEdition: boolean
  shopDiscount: number
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null
      isAdmin: boolean
      adminRole: string | null
      SubscriptionPlan: SubscriptionPlanData | null
      subscriptionEnd: Date | null
    }
  }
  interface User {
    isAdmin?: boolean
    adminRole?: string | null
    SubscriptionPlan?: SubscriptionPlanData | null
    subscriptionEnd?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    isAdmin?: boolean
    adminRole?: string | null
    SubscriptionPlan?: SubscriptionPlanData | null
    subscriptionEnd?: Date | null
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    // Credentials provider configured in auth.ts with Prisma
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // authorize is set in auth.ts
      authorize: () => null,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin
        token.adminRole = user.adminRole
        token.SubscriptionPlan = user.SubscriptionPlan
        token.subscriptionEnd = user.subscriptionEnd
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = (token.isAdmin as boolean) ?? false
        session.user.adminRole = (token.adminRole as string | null) ?? null
        session.user.SubscriptionPlan = (token.SubscriptionPlan as SubscriptionPlanData | null) ?? null
        session.user.subscriptionEnd = (token.subscriptionEnd as Date | null) ?? null
      }
      return session
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
}
