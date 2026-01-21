import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Default button settings
const defaultButtonSettings = {
  primary: {
    backgroundColor: "#FA4860",
    textColor: "#FFFFFF",
    borderRadius: "0",
    fontSize: "16",
    fontWeight: "500",
    padding: "10px 28px",
    hoverBackgroundColor: "#E03E54",
    hoverTextColor: "#FFFFFF",
  },
  secondary: {
    backgroundColor: "transparent",
    textColor: "#FA4860",
    borderRadius: "0",
    fontSize: "16",
    fontWeight: "500",
    padding: "10px 28px",
    borderColor: "#FA4860",
    borderWidth: "2",
    hoverBackgroundColor: "#FA4860",
    hoverTextColor: "#FFFFFF",
  },
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { key: "design_buttons" },
    })

    return NextResponse.json({
      buttons: settings?.value || defaultButtonSettings,
    })
  } catch (error) {
    console.error("Error loading design settings:", error)
    return NextResponse.json(
      { error: "Error al cargar configuración" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Check if admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { buttons } = body

    await prisma.siteSettings.upsert({
      where: { key: "design_buttons" },
      update: { value: buttons },
      create: { key: "design_buttons", value: buttons },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving design settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
