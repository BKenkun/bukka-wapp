import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// GET - Obtener perfil del usuario actual
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        subscriptionPlanId: true,
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
            shopDiscount: true,
          },
        },
        subscriptionStart: true,
        subscriptionEnd: true,
        bio: true,
        forumSignature: true,
        relationshipStatus: true,
        relationshipRole: true,
        isVerified: true,
        joinedAt: true,
        isFounder: true,
        // Preferencias de notificación
        notifyEmail: true,
        notifyNewContent: true,
        notifySubscription: true,
        notifyMarketing: true,
        _count: {
          select: {
            favorites: true,
            Order: true,
            Comment: true,
            ForumPost: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Transform response for frontend compatibility
    const { SubscriptionPlan, ...rest } = user
    const transformedUser = {
      ...rest,
      subscriptionPlan: SubscriptionPlan,
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Error fetching user profile" },
      { status: 500 }
    )
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(500).optional().nullable(),
  forumSignature: z.string().max(200).optional().nullable(),
  relationshipStatus: z.enum(["SINGLE", "MARRIED", "IN_RELATIONSHIP"]).optional().nullable(),
  relationshipRole: z.enum(["BULL", "VOYEUR", "CUCKOLD", "STAG", "HOTWIFE", "OTHER"]).optional().nullable(),
  image: z.string().min(1).optional().nullable(),
  // Preferencias de notificación
  notifyEmail: z.boolean().optional(),
  notifyNewContent: z.boolean().optional(),
  notifySubscription: z.boolean().optional(),
  notifyMarketing: z.boolean().optional(),
})

// PATCH - Actualizar perfil del usuario
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const data = validatedData.data

    // Check if username is taken (if updating username)
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: session.user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.forumSignature !== undefined && { forumSignature: data.forumSignature }),
        ...(data.relationshipStatus !== undefined && { relationshipStatus: data.relationshipStatus }),
        ...(data.relationshipRole !== undefined && { relationshipRole: data.relationshipRole }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.notifyEmail !== undefined && { notifyEmail: data.notifyEmail }),
        ...(data.notifyNewContent !== undefined && { notifyNewContent: data.notifyNewContent }),
        ...(data.notifySubscription !== undefined && { notifySubscription: data.notifySubscription }),
        ...(data.notifyMarketing !== undefined && { notifyMarketing: data.notifyMarketing }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        forumSignature: true,
        relationshipStatus: true,
        relationshipRole: true,
        notifyEmail: true,
        notifyNewContent: true,
        notifySubscription: true,
        notifyMarketing: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Error updating profile" },
      { status: 500 }
    )
  }
}
