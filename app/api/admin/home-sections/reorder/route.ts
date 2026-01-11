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

// POST - Reordenar secciones (admin)
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await checkIsAdmin(session.user.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { orderedIds } = body as { orderedIds: string[] }

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de IDs ordenados" },
        { status: 400 }
      )
    }

    // Update all sections with their new order
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.homeSection.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering home sections:", error)
    return NextResponse.json(
      { error: "Error al reordenar secciones" },
      { status: 500 }
    )
  }
}
