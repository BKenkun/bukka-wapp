import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sections = await prisma.shopSection.findMany({
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error("Error fetching shop sections:", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, enabled, config } = body

    const maxOrder = await prisma.shopSection.aggregate({
      _max: { order: true },
    })

    const section = await prisma.shopSection.create({
      data: {
        type,
        title: title || null,
        enabled: enabled ?? true,
        order: (maxOrder._max.order ?? 0) + 1,
        config: config || {},
      },
    })

    return NextResponse.json({ section })
  } catch (error) {
    console.error("Error creating shop section:", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
