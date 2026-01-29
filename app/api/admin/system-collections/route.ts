import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { SystemCollectionType } from "@prisma/client"

// Default system collections configuration
const DEFAULT_COLLECTIONS: {
  type: SystemCollectionType
  slug: string
  name: string
  description: string
  order: number
}[] = [
  {
    type: "MAS_VISTOS",
    slug: "mas-vistos",
    name: "Más Vistos",
    description: "Los vídeos con más reproducciones de todos los tiempos",
    order: 1,
  },
  {
    type: "NUEVOS",
    slug: "nuevos",
    name: "Más Nuevos",
    description: "Los vídeos más recientes",
    order: 2,
  },
  {
    type: "TENDENCIAS",
    slug: "tendencias",
    name: "Tendencias",
    description: "Los vídeos más populares de la última semana",
    order: 3,
  },
  {
    type: "MEJOR_VALORADOS",
    slug: "mejor-valorados",
    name: "Mejor Valorados",
    description: "Los vídeos con más likes",
    order: 4,
  },
  {
    type: "MAS_COMENTADOS",
    slug: "mas-comentados",
    name: "Más Comentados",
    description: "Los vídeos con más comentarios",
    order: 5,
  },
  {
    type: "RECOMENDADOS",
    slug: "recomendados",
    name: "Recomendados",
    description: "Selección de vídeos recomendados",
    order: 6,
  },
]

// GET - List all system collections
export async function GET() {
  try {
    // Ensure all default collections exist
    for (const collection of DEFAULT_COLLECTIONS) {
      await prisma.systemCollection.upsert({
        where: { type: collection.type },
        update: {},
        create: collection,
      })
    }

    // Fetch all collections ordered
    const collections = await prisma.systemCollection.findMany({
      orderBy: { order: "asc" },
    })

    return NextResponse.json(collections)
  } catch (error) {
    console.error("Error fetching system collections:", error)
    return NextResponse.json(
      { error: "Error al obtener las colecciones del sistema" },
      { status: 500 }
    )
  }
}

// PATCH - Update a system collection (enable/disable, update name, etc.)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, isEnabled, name, description, imageUrl, order } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID de colección requerido" },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (typeof isEnabled === "boolean") updateData.isEnabled = isEnabled
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (typeof order === "number") updateData.order = order

    const collection = await prisma.systemCollection.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(collection)
  } catch (error) {
    console.error("Error updating system collection:", error)
    return NextResponse.json(
      { error: "Error al actualizar la colección" },
      { status: 500 }
    )
  }
}
