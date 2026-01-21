import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// POST - Crear performer (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      bio,
      profileImage,
      coverImage,
      location,
    } = body

    // Verificar slug único
    const existingPerformer = await prisma.performer.findUnique({
      where: { slug },
    })

    if (existingPerformer) {
      return NextResponse.json(
        { error: "Ya existe una performer con ese slug" },
        { status: 400 }
      )
    }

    const performer = await prisma.performer.create({
      data: {
        name,
        slug,
        bio,
        profileImage: profileImage || null,
        coverImage: coverImage || null,
        location: location || null,
      },
    })

    return NextResponse.json(performer, { status: 201 })
  } catch (error) {
    console.error("Error creating performer:", error)
    return NextResponse.json(
      { error: "Error al crear performer" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parámetros de paginación
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const skip = (page - 1) * limit

    // Filtros
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sort") || "name"
    const sortOrder = searchParams.get("order") || "asc"

    // Construir query
    const where: Record<string, unknown> = {}

    // Búsqueda por nombre
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
      ]
    }

    // Ordenación
    const orderBy: Record<string, string> = {}
    if (sortBy === "name") {
      orderBy.name = sortOrder
    } else if (sortBy === "videos") {
      orderBy.videoCount = sortOrder
    } else if (sortBy === "newest") {
      orderBy.createdAt = sortOrder
    }

    // Ejecutar query
    const [performers, total] = await Promise.all([
      prisma.performer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          bio: true,
          profileImage: true,
          coverImage: true,
          location: true,
          videoCount: true,
        },
      }),
      prisma.performer.count({ where }),
    ])

    return NextResponse.json({
      performers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching performers:", error)
    return NextResponse.json(
      { error: "Error al obtener performers" },
      { status: 500 }
    )
  }
}

// GET filtros disponibles
export async function OPTIONS() {
  try {
    const locations = await prisma.performer.findMany({
      where: { location: { not: null } },
      select: { location: true },
      distinct: ["location"],
    })

    return NextResponse.json({
      filters: {
        locations: locations.map((p) => p.location).filter(Boolean),
      },
    })
  } catch (error) {
    console.error("Error fetching filters:", error)
    return NextResponse.json(
      { error: "Error al obtener filtros" },
      { status: 500 }
    )
  }
}
