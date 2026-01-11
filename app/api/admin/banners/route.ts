import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bannerSchema = z.object({
  title: z.string().min(1, "El titulo es requerido"),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().min(1, "La imagen es requerida"),
  linkUrl: z.string().optional().nullable(),
  placement: z.enum(["HOME_TOP", "HOME_MIDDLE", "SIDEBAR", "FOOTER", "VIDEO_PAGE", "SHOP_PAGE"]),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  order: z.number().optional().default(0),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const banners = await prisma.banner.findMany({
      orderBy: [{ placement: "asc" }, { order: "asc" }],
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error("Error fetching banners:", error)
    return NextResponse.json({ error: "Error al obtener banners" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = bannerSchema.parse(body)

    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        placement: data.placement,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive,
        order: data.order,
      },
    })

    return NextResponse.json({ banner })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating banner:", error)
    return NextResponse.json({ error: "Error al crear banner" }, { status: 500 })
  }
}
