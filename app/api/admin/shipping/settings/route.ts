import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const settingsSchema = z.object({
  freeShippingEnabled: z.boolean(),
  freeShippingThreshold: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  defaultWeight: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? parseFloat(String(val)) : 0.5)),
  enableWeightCalculation: z.boolean().default(false),
  fallbackZoneId: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create settings
    let settings = await prisma.shippingSettings.findFirst()

    if (!settings) {
      settings = await prisma.shippingSettings.create({
        data: {
          freeShippingEnabled: false,
          freeShippingThreshold: null,
          defaultWeight: (0.5),
          enableWeightCalculation: false,
          fallbackZoneId: null,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching shipping settings:", error)
    return NextResponse.json({ error: "Error al obtener configuracion" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = settingsSchema.partial().parse(body)

    // Get existing settings
    let settings = await prisma.shippingSettings.findFirst()

    const updateData: Record<string, unknown> = {}
    if (data.freeShippingEnabled !== undefined) {
      updateData.freeShippingEnabled = data.freeShippingEnabled
    }
    if (data.freeShippingThreshold !== undefined) {
      updateData.freeShippingThreshold = data.freeShippingThreshold
        ? (data.freeShippingThreshold)
        : null
    }
    if (data.defaultWeight !== undefined) {
      updateData.defaultWeight = (data.defaultWeight)
    }
    if (data.enableWeightCalculation !== undefined) {
      updateData.enableWeightCalculation = data.enableWeightCalculation
    }
    if (data.fallbackZoneId !== undefined) {
      updateData.fallbackZoneId = data.fallbackZoneId
    }

    if (settings) {
      settings = await prisma.shippingSettings.update({
        where: { id: settings.id },
        data: updateData,
      })
    } else {
      settings = await prisma.shippingSettings.create({
        data: {
          freeShippingEnabled: data.freeShippingEnabled ?? false,
          freeShippingThreshold: data.freeShippingThreshold
            ? (data.freeShippingThreshold)
            : null,
          defaultWeight: (data.defaultWeight ?? 0.5),
          enableWeightCalculation: data.enableWeightCalculation ?? false,
          fallbackZoneId: data.fallbackZoneId ?? null,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating shipping settings:", error)
    return NextResponse.json({ error: "Error al actualizar configuracion" }, { status: 500 })
  }
}
