import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// GET - Obtener historial de visualización
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const [history, total] = await Promise.all([
      prisma.watchHistory.findMany({
        where: { userId: session.user.id },
        include: {
          video: {
            select: {
              id: true,
              slug: true,
              title: true,
              thumbnailUrl: true,
              duration: true,
              viewCount: true,
              likeCount: true,
              performers: {
                include: {
                  performer: {
                    select: { name: true },
                  },
                },
                take: 1,
              },
            },
          },
        },
        orderBy: { lastWatchedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.watchHistory.count({
        where: { userId: session.user.id },
      }),
    ])

    const transformedHistory = history.map((h) => ({
      id: h.id,
      watchedSeconds: h.watchedSeconds,
      completed: h.completed,
      lastWatchedAt: h.lastWatchedAt.toISOString(),
      progress: h.video.duration > 0
        ? Math.round((h.watchedSeconds / h.video.duration) * 100)
        : 0,
      video: {
        id: h.video.id,
        slug: h.video.slug,
        title: h.video.title,
        thumbnailUrl: h.video.thumbnailUrl,
        duration: h.video.duration,
        viewCount: h.video.viewCount,
        likeCount: h.video.likeCount,
        performerName: h.video.performers[0]?.performer?.name || null,
      },
    }))

    return NextResponse.json({
      history: transformedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching watch history:", error)
    return NextResponse.json(
      { error: "Error fetching watch history" },
      { status: 500 }
    )
  }
}

const updateHistorySchema = z.object({
  videoId: z.string(),
  watchedSeconds: z.number().int().min(0),
  completed: z.boolean().optional(),
})

// POST - Registrar/actualizar visualización
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateHistorySchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { videoId, watchedSeconds, completed } = validatedData.data

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, duration: true },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Upsert watch history
    const history = await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId,
        },
      },
      update: {
        watchedSeconds: Math.max(watchedSeconds, 0),
        completed: completed ?? (video.duration > 0 && watchedSeconds >= video.duration * 0.9),
        lastWatchedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        videoId,
        watchedSeconds: Math.max(watchedSeconds, 0),
        completed: completed ?? (video.duration > 0 && watchedSeconds >= video.duration * 0.9),
      },
    })

    return NextResponse.json({
      history: {
        id: history.id,
        watchedSeconds: history.watchedSeconds,
        completed: history.completed,
        lastWatchedAt: history.lastWatchedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error updating watch history:", error)
    return NextResponse.json(
      { error: "Error updating watch history" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar entrada del historial
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")
    const clearAll = searchParams.get("clearAll") === "true"

    if (clearAll) {
      // Clear all history
      await prisma.watchHistory.deleteMany({
        where: { userId: session.user.id },
      })
      return NextResponse.json({ message: "Watch history cleared" })
    }

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      )
    }

    await prisma.watchHistory.delete({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId,
        },
      },
    })

    return NextResponse.json({ message: "History entry removed" })
  } catch (error) {
    console.error("Error deleting history:", error)
    return NextResponse.json(
      { error: "Error deleting history" },
      { status: 500 }
    )
  }
}
