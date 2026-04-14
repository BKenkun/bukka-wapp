import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function getPerformerId(slugOrId: string): Promise<string | null> {
  // Try by ID first, then by slug
  const performer = await prisma.performer.findFirst({
    where: { OR: [{ id: slugOrId }, { slug: slugOrId }] },
    select: { id: true },
  })
  return performer?.id || null
}

// GET - Check if user is subscribed
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ subscribed: false })
    }

    const { slug } = await params
    const performerId = await getPerformerId(slug)
    if (!performerId) return NextResponse.json({ subscribed: false })

    const notify = await prisma.performerNotify.findUnique({
      where: {
        userId_performerId: {
          userId: session.user.id,
          performerId,
        },
      },
    })

    return NextResponse.json({
      subscribed: !!notify,
      notified: notify?.notified || false,
    })
  } catch {
    return NextResponse.json({ subscribed: false })
  }
}

// POST - Toggle subscribe/unsubscribe
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Login required" }, { status: 401 })
    }

    const { slug } = await params
    const performerId = await getPerformerId(slug)

    if (!performerId) {
      return NextResponse.json({ error: "Performer not found" }, { status: 404 })
    }

    const existing = await prisma.performerNotify.findUnique({
      where: {
        userId_performerId: {
          userId: session.user.id,
          performerId,
        },
      },
    })

    if (existing) {
      await prisma.performerNotify.delete({ where: { id: existing.id } })
      return NextResponse.json({ subscribed: false })
    } else {
      await prisma.performerNotify.create({
        data: { userId: session.user.id, performerId },
      })
      return NextResponse.json({ subscribed: true })
    }
  } catch (error) {
    console.error("Notify toggle error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
