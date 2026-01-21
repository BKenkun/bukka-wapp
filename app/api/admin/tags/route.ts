import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const tagSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            VideoTag: true,
            ProductTag: true,
          },
        },
      },
    })

    const transformedTags = tags.map((tag) => ({
      ...tag,
      _count: {
        videos: tag._count.VideoTag,
        products: tag._count.ProductTag,
      },
    }))

    return NextResponse.json({ tags: transformedTags })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Error al obtener tags" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = tagSchema.parse(body)

    // Check if slug is unique
    const existingSlug = await prisma.tag.findUnique({
      where: { slug: data.slug },
    })

    if (existingSlug) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    })

    return NextResponse.json({ tag })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: "Error al crear tag" }, { status: 500 })
  }
}
