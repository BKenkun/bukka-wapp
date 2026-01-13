import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

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
  interface JWT {
    id?: string
    isAdmin?: boolean
    adminRole?: string | null
    SubscriptionPlan?: SubscriptionPlanData | null
    subscriptionEnd?: Date | null
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            isAdmin: true,
            adminRole: true,
            subscriptionEnd: true,
            SubscriptionPlan: {
              select: {
                id: true,
                slug: true,
                name: true,
                level: true,
                maxVideoQuality: true,
                canComment: true,
                canAccessForum: true,
                canDownload: true,
                canAccessExclusive: true,
                canAccessLimitedEdition: true,
                shopDiscount: true,
              },
            },
          },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: user.isAdmin,
          adminRole: user.adminRole,
          SubscriptionPlan: user.SubscriptionPlan,
          subscriptionEnd: user.subscriptionEnd,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin
        token.adminRole = user.adminRole
        token.SubscriptionPlan = user.SubscriptionPlan
        token.subscriptionEnd = user.subscriptionEnd
      }
      // Refresh subscription info when session is updated
      if (trigger === "update" && token.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            adminRole: true,
            subscriptionEnd: true,
            SubscriptionPlan: {
              select: {
                id: true,
                slug: true,
                name: true,
                level: true,
                maxVideoQuality: true,
                canComment: true,
                canAccessForum: true,
                canDownload: true,
                canAccessExclusive: true,
                canAccessLimitedEdition: true,
                shopDiscount: true,
              },
            },
          },
        })
        if (freshUser) {
          token.adminRole = freshUser.adminRole
          token.SubscriptionPlan = freshUser.SubscriptionPlan
          token.subscriptionEnd = freshUser.subscriptionEnd
        }
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
})
