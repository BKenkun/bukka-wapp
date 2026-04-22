import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import { mergeGuestCartIntoUser } from "@/lib/cart-session"

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await mergeGuestCartIntoUser(user.id)
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
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
            name: true,
            image: true,
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
          token.name = freshUser.name
          token.picture = freshUser.image
          token.adminRole = freshUser.adminRole
          token.SubscriptionPlan = freshUser.SubscriptionPlan
          token.subscriptionEnd = freshUser.subscriptionEnd
        }
      }
      return token
    },
  },
})
