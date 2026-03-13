import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const section = await prisma.shopSection.findUnique({ where: { id } })

    if (!section) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ section })
  } catch (error) {
    console.error("Error fetching shop section:", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const section = await prisma.shopSection.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.config !== undefined && { config: body.config }),
      },
    })

    return NextResponse.json({ section })
  } catch (error) {
    console.error("Error updating shop section:", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.shopSection.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting shop section:", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
