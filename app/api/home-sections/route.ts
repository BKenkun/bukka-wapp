import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Obtener secciones del home (público)
export async function GET() {
  try {
    const sections = await prisma.homeSection.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error("Error fetching home sections:", error)
    return NextResponse.json(
      { error: "Error fetching sections" },
      { status: 500 }
    )
  }
}
