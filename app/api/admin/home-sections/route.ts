import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function checkIsAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })
  return user?.isAdmin ?? false
}

// GET - Obtener todas las secciones (admin)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await checkIsAdmin(session.user.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const sections = await prisma.homeSection.findMany({
      orderBy: { order: "asc" },
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error("Error fetching home sections:", error)
    return NextResponse.json(
      { error: "Error al obtener secciones" },
      { status: 500 }
    )
  }
}

// POST - Crear nueva sección (admin)
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await checkIsAdmin(session.user.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, enabled, order, config } = body

    // Get the next order value if not provided
    let sectionOrder = order
    if (sectionOrder === undefined) {
      const lastSection = await prisma.homeSection.findFirst({
        orderBy: { order: "desc" },
      })
      sectionOrder = (lastSection?.order ?? 0) + 1
    }

    const section = await prisma.homeSection.create({
      data: {
        type,
        title,
        enabled: enabled ?? true,
        order: sectionOrder,
        config: config ?? {},
      },
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    console.error("Error creating home section:", error)
    return NextResponse.json(
      { error: "Error al crear sección" },
      { status: 500 }
    )
  }
}
