import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  isPacklinkConfigured,
  getPacklinkRates,
  createPacklinkDraft,
  getPacklinkLabels,
  DEFAULT_PACKAGE,
} from "@/lib/packlink"

interface ShippingAddress {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  return user?.isAdmin ? session : null
}

// GET — tarifas disponibles para el pedido (y etiquetas si ya hay envío creado)
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  if (!isPacklinkConfigured()) {
    return NextResponse.json({ error: "PACKLINK_API_KEY no configurada" }, { status: 400 })
  }

  const { id } = await ctx.params
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })

  const address = (order.shippingAddress || {}) as ShippingAddress
  if (!address.postalCode) {
    return NextResponse.json({ error: "El pedido no tiene dirección de envío" }, { status: 400 })
  }

  try {
    // Si ya hay envío creado, devolvemos también las etiquetas disponibles
    let labels: string[] = []
    if (order.packlinkReference) {
      labels = await getPacklinkLabels(order.packlinkReference).catch(() => [])
    }

    const rates = await getPacklinkRates({
      toZip: address.postalCode,
      toCountry: address.country || "ES",
    })

    return NextResponse.json({
      reference: order.packlinkReference,
      labels,
      rates: rates.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 10),
      defaultPackage: DEFAULT_PACKAGE,
    })
  } catch (error) {
    console.error("[Packlink] rates error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error consultando Packlink" },
      { status: 502 }
    )
  }
}

// POST — crea el borrador de envío en Packlink con el servicio elegido
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  if (!isPacklinkConfigured()) {
    return NextResponse.json({ error: "PACKLINK_API_KEY no configurada" }, { status: 400 })
  }

  const { id } = await ctx.params
  const body = (await req.json().catch(() => ({}))) as {
    serviceId?: number
    weight?: number
  }

  if (!body.serviceId) {
    return NextResponse.json({ error: "Falta serviceId (tarifa elegida)" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      OrderItem: { select: { quantity: true, product: { select: { name: true } } } },
    },
  })
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })

  if (order.packlinkReference) {
    return NextResponse.json(
      { error: `Este pedido ya tiene un envío en Packlink (${order.packlinkReference})` },
      { status: 400 }
    )
  }

  const address = (order.shippingAddress || {}) as ShippingAddress
  if (!address.postalCode || !address.address || !address.city) {
    return NextResponse.json({ error: "Dirección de envío incompleta" }, { status: 400 })
  }

  try {
    const content =
      order.OrderItem.map((i) => `${i.quantity}x ${i.product.name}`).join(", ").slice(0, 250) ||
      `Order ${order.orderNumber}`

    const reference = await createPacklinkDraft({
      serviceId: body.serviceId,
      to: {
        name: address.firstName || "Cliente",
        surname: address.lastName || "-",
        street: address.address,
        city: address.city,
        zip: address.postalCode,
        country: address.country || "ES",
        email: address.email || order.guestEmail || "",
        phone: address.phone || "",
      },
      packages: body.weight ? [{ ...DEFAULT_PACKAGE, weight: body.weight }] : undefined,
      content,
      contentValue: Number(order.total),
      source: `order-${order.orderNumber}`,
    })

    await prisma.order.update({
      where: { id },
      data: { packlinkReference: reference },
    })

    return NextResponse.json({ reference })
  } catch (error) {
    console.error("[Packlink] draft error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creando el envío en Packlink" },
      { status: 502 }
    )
  }
}
