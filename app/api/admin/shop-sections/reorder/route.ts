import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderedIds } = body as { orderedIds: string[] }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.shopSection.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering shop sections:", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
