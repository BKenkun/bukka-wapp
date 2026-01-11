import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const SETTINGS_KEY = "payment_gateways"

// GET - Obtener configuración de pasarelas
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!settings) {
      return NextResponse.json({
        gateways: {},
        defaultGateway: "",
        testMode: true,
      })
    }

    // Sanitize sensitive data for response
    const data = settings.value as {
      gateways: Record<string, { enabled: boolean; config: Record<string, string> }>
      defaultGateway: string
      testMode: boolean
    }

    // Mask sensitive fields
    const sanitizedGateways: Record<string, { enabled: boolean; config: Record<string, string> }> = {}

    for (const [gatewayId, gatewayConfig] of Object.entries(data.gateways || {})) {
      sanitizedGateways[gatewayId] = {
        enabled: gatewayConfig.enabled,
        config: {},
      }

      for (const [key, value] of Object.entries(gatewayConfig.config || {})) {
        // Mask password/secret fields
        if (key.toLowerCase().includes("secret") || key.toLowerCase().includes("password") || key.toLowerCase().includes("key")) {
          sanitizedGateways[gatewayId].config[key] = value ? "••••••••" : ""
        } else {
          sanitizedGateways[gatewayId].config[key] = value
        }
      }
    }

    return NextResponse.json({
      gateways: sanitizedGateways,
      defaultGateway: data.defaultGateway || "",
      testMode: data.testMode ?? true,
    })
  } catch (error) {
    console.error("Error fetching payment gateway settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

// POST - Guardar configuración de pasarelas
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { gateways, defaultGateway, testMode } = body

    // Get existing settings to preserve masked values
    const existingSettings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    const existingData = existingSettings?.value as {
      gateways: Record<string, { enabled: boolean; config: Record<string, string> }>
    } | null

    // Merge new values with existing, preserving masked fields
    const mergedGateways: Record<string, { enabled: boolean; config: Record<string, string> }> = {}

    for (const [gatewayId, gatewayConfig] of Object.entries(gateways || {})) {
      const config = gatewayConfig as { enabled: boolean; config: Record<string, string> }
      mergedGateways[gatewayId] = {
        enabled: config.enabled,
        config: {},
      }

      for (const [key, value] of Object.entries(config.config || {})) {
        // If value is masked, use existing value
        if (value === "••••••••") {
          mergedGateways[gatewayId].config[key] = existingData?.gateways?.[gatewayId]?.config?.[key] || ""
        } else {
          mergedGateways[gatewayId].config[key] = value
        }
      }
    }

    await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: {
          gateways: mergedGateways,
          defaultGateway: defaultGateway || "",
          testMode: testMode ?? true,
        },
      },
      update: {
        value: {
          gateways: mergedGateways,
          defaultGateway: defaultGateway || "",
          testMode: testMode ?? true,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving payment gateway settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
