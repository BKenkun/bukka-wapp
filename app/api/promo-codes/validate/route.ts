import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code, subtotal } = body

    if (!code) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 })
    }

    // Find the promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!promoCode) {
      return NextResponse.json({ error: "Código no válido" }, { status: 404 })
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json({ error: "Este código ya no está activo" }, { status: 400 })
    }

    // Check if applicable to shop
    if (promoCode.applicableTo !== "ALL" && promoCode.applicableTo !== "SHOP") {
      return NextResponse.json({ error: "Este código no es válido para la tienda" }, { status: 400 })
    }

    // Check date validity
    const now = new Date()
    if (promoCode.startDate && now < promoCode.startDate) {
      return NextResponse.json({ error: "Este código aún no está activo" }, { status: 400 })
    }
    if (promoCode.endDate && now > promoCode.endDate) {
      return NextResponse.json({ error: "Este código ha expirado" }, { status: 400 })
    }

    // Check max uses
    if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json({ error: "Este código ha alcanzado su límite de uso" }, { status: 400 })
    }

    // Calculate discount
    let discountAmount = 0
    if (promoCode.discountType === "PERCENTAGE") {
      discountAmount = (subtotal * Number(promoCode.discountValue)) / 100
    } else {
      discountAmount = Math.min(Number(promoCode.discountValue), subtotal)
    }

    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: Number(promoCode.discountValue),
      discountAmount: Math.round(discountAmount * 100) / 100,
      message: promoCode.discountType === "PERCENTAGE"
        ? `${Number(promoCode.discountValue)}% de descuento aplicado`
        : `${Number(promoCode.discountValue).toFixed(2)}€ de descuento aplicado`,
    })
  } catch (error) {
    console.error("Error validating promo code:", error)
    return NextResponse.json({ error: "Error al validar código" }, { status: 500 })
  }
}
