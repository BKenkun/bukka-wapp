import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET - Obtener página pública (solo publicadas)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const page = await prisma.page.findUnique({
      where: {
        slug,
        status: "PUBLISHED"
      },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        excerpt: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error("Error fetching page:", error)
    return NextResponse.json(
      { error: "Error fetching page" },
      { status: 500 }
    )
  }
}
