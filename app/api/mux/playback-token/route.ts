import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getPlaybackToken } from "@/lib/mux/client"

export async function GET(request: NextRequest) {
  try {
    // Only admins can get playback tokens directly
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const playbackId = searchParams.get("playbackId")

    if (!playbackId) {
      return NextResponse.json({ error: "playbackId required" }, { status: 400 })
    }

    const token = await getPlaybackToken(playbackId, session.user.id)

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Error getting playback token:", error)
    return NextResponse.json(
      { error: "Error fetching playback token" },
      { status: 500 }
    )
  }
}
