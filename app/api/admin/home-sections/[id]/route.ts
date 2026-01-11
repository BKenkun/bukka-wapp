import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

async function checkIsAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })
  return user?.isAdmin ?? false
}

// GET - Obtener sección por ID (admin)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await checkIsAdmin(session.user.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const section = await prisma.homeSection.findUnique({
      where: { id },
    })

    if (!section) {
      return NextResponse.json(
        { error: "Sección no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(section)
  } catch (error) {
    console.error("Error fetching home section:", error)
    return NextResponse.json(
      { error: "Error al obtener sección" },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar sección (admin)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await checkIsAdmin(session.user.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existingSection = await prisma.homeSection.findUnique({
      where: { id },
    })

    if (!existingSection) {
      return NextResponse.json(
        { error: "Sección no encontrada" },
        { status: 404 }
      )
    }

    const { title, enabled, order, config } = body

    const section = await prisma.homeSection.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(enabled !== undefined && { enabled }),
        ...(order !== undefined && { order }),
        ...(config !== undefined && { config }),
      },
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error("Error updating home section:", error)
    return NextResponse.json(
      { error: "Error al actualizar sección" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar sección (admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await checkIsAdmin(session.user.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const existingSection = await prisma.homeSection.findUnique({
      where: { id },
    })

    if (!existingSection) {
      return NextResponse.json(
        { error: "Sección no encontrada" },
        { status: 404 }
      )
    }

    await prisma.homeSection.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting home section:", error)
    return NextResponse.json(
      { error: "Error al eliminar sección" },
      { status: 500 }
    )
  }
}
