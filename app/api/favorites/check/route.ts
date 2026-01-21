import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ isFavorite: false })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")
    const performerId = searchParams.get("performerId")
    const productId = searchParams.get("productId")

    if (!videoId && !performerId && !productId) {
      return NextResponse.json(
        { error: "Must provide videoId, performerId, or productId" },
        { status: 400 }
      )
    }

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        ...(videoId && { videoId }),
        ...(performerId && { performerId }),
        ...(productId && { productId }),
      },
    })

    return NextResponse.json({ isFavorite: !!favorite })
  } catch (error) {
    console.error("Error checking favorite:", error)
    return NextResponse.json(
      { error: "Error checking favorite" },
      { status: 500 }
    )
  }
}
