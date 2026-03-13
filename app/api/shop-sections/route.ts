import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const sections = await prisma.shopSection.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error("Error fetching shop sections:", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
