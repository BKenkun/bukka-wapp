import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { isPacklinkConfigured, getPacklinkRates, DEFAULT_PACKAGE } from "@/lib/packlink"

const calculateSchema = z.object({
  postalCode: z.string().min(1, "Codigo postal requerido"),
  country: z.string().default("ES"),
  subtotal: z.number().min(0),
  weight: z.number().optional(),
})

// Convierte el transit time de Packlink ("24 HOURS", "1 DAY", "2-3 DAYS"...) a días
function transitTimeToDays(transitTime: string | null): number | null {
  if (!transitTime) return null
  const t = transitTime.toUpperCase()
  const num = t.match(/(\d+)(?:\s*-\s*\d+)?/)
  if (!num) return null
  const value = parseInt(num[1], 10)
  if (t.includes("HOUR")) return Math.max(1, Math.ceil(value / 24))
  return value
}

// POST /api/shipping/calculate
// Public API to calculate shipping options for checkout
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = calculateSchema.parse(body)

    // Get shipping settings
    const settings = await prisma.shippingSettings.findFirst()

    // Envío gratis global (se aplica también sobre tarifas Packlink)
    const freeShippingApplies = Boolean(
      settings?.freeShippingEnabled &&
        settings.freeShippingThreshold &&
        data.subtotal >= Number(settings.freeShippingThreshold)
    )

    let freeShippingInfo: { threshold: number; remaining: number; percentage: number } | null = null
    if (settings?.freeShippingEnabled && settings.freeShippingThreshold) {
      const threshold = Number(settings.freeShippingThreshold)
      const remaining = threshold - data.subtotal
      if (remaining > 0) {
        freeShippingInfo = {
          threshold,
          remaining,
          percentage: Math.min(100, (data.subtotal / threshold) * 100),
        }
      }
    }

    // ── Fuente principal: tarifas en vivo de Packlink PRO ──────────────
    if (isPacklinkConfigured()) {
      try {
        const packlinkRates = await getPacklinkRates({
          toZip: data.postalCode,
          toCountry: data.country,
          packages: data.weight ? [{ ...DEFAULT_PACKAGE, weight: data.weight }] : undefined,
        })

        // En el checkout solo ofrecemos entrega a domicilio (la dirección que
        // recoge el formulario); los servicios a punto de recogida se descartan
        const homeDelivery = packlinkRates.filter((r) => !r.deliveryToParcelshop)

        if (homeDelivery.length > 0) {
          const rates = homeDelivery
            .sort((a, b) => a.totalPrice - b.totalPrice)
            .slice(0, 6)
            .map((r) => ({
              id: `packlink-${r.id}`,
              name: `${r.carrierName} · ${r.serviceName}`.trim(),
              description: null,
              originalPrice: r.totalPrice,
              price: freeShippingApplies ? 0 : r.totalPrice,
              isFree: freeShippingApplies,
              estimatedDays: transitTimeToDays(r.transitTime),
              isAvailable: true,
            }))

          return NextResponse.json({
            available: true,
            zone: { id: "packlink", name: "Packlink" },
            rates,
            freeShippingInfo,
          })
        }
      } catch (error) {
        // Si Packlink no responde, seguimos con las zonas propias como fallback
        console.error("[Shipping] Packlink rates failed, falling back to zones:", error)
      }
    }

    // Find matching zones
    const zones = await prisma.shippingZone.findMany({
      where: { isActive: true },
      include: {
        rates: {
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { price: "asc" }],
        },
      },
      orderBy: { order: "asc" },
    })

    // Find zone that matches postal code or country
    let matchingZone = zones.find((zone) => {
      // Check postal code patterns
      if (zone.postalCodes.length > 0) {
        for (const pattern of zone.postalCodes) {
          if (pattern.endsWith("*")) {
            // Wildcard pattern like "28*"
            const prefix = pattern.slice(0, -1)
            if (data.postalCode.startsWith(prefix)) {
              return true
            }
          } else if (data.postalCode === pattern) {
            return true
          }
        }
      }

      // Check country
      if (zone.countries.length > 0) {
        return zone.countries.includes(data.country)
      }

      return false
    })

    // Fallback to default zone if configured
    if (!matchingZone && settings?.fallbackZoneId) {
      matchingZone = zones.find((z) => z.id === settings.fallbackZoneId)
    }

    if (!matchingZone || matchingZone.rates.length === 0) {
      return NextResponse.json({
        available: false,
        message: "No shipping options available for this location",
        rates: [],
      })
    }

    // Calculate rates with free shipping
    const rates = matchingZone.rates.map((rate) => {
      let finalPrice = Number(rate.price)
      let isFree = false

      // Check per-rate free shipping threshold
      if (rate.freeShippingAmount && data.subtotal >= Number(rate.freeShippingAmount)) {
        finalPrice = 0
        isFree = true
      }

      // Check global free shipping threshold
      if (
        settings?.freeShippingEnabled &&
        settings.freeShippingThreshold &&
        data.subtotal >= Number(settings.freeShippingThreshold)
      ) {
        finalPrice = 0
        isFree = true
      }

      // Check weight limits if weight calculation is enabled
      let isAvailable = true
      if (settings?.enableWeightCalculation && data.weight) {
        if (rate.minWeight && data.weight < Number(rate.minWeight)) {
          isAvailable = false
        }
        if (rate.maxWeight && data.weight > Number(rate.maxWeight)) {
          isAvailable = false
        }
      }

      return {
        id: rate.id,
        name: rate.name,
        description: rate.description,
        originalPrice: Number(rate.price),
        price: finalPrice,
        isFree,
        estimatedDays: rate.estimatedDays,
        isAvailable,
      }
    }).filter((r) => r.isAvailable)

    return NextResponse.json({
      available: rates.length > 0,
      zone: {
        id: matchingZone.id,
        name: matchingZone.name,
      },
      rates,
      freeShippingInfo,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error calculating shipping:", error)
    return NextResponse.json({ error: "Error calculating shipping" }, { status: 500 })
  }
}
