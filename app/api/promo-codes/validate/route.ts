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
      return NextResponse.json({ error: "Code required" }, { status: 400 })
    }

    // Find the promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!promoCode) {
      return NextResponse.json({ error: "Invalid code" }, { status: 404 })
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json({ error: "This code is no longer active" }, { status: 400 })
    }

    // Check if applicable to shop
    if (promoCode.applicableTo !== "ALL" && promoCode.applicableTo !== "SHOP") {
      return NextResponse.json({ error: "This code is not valid for the shop" }, { status: 400 })
    }

    // Check date validity
    const now = new Date()
    if (promoCode.startDate && now < promoCode.startDate) {
      return NextResponse.json({ error: "This code is not active yet" }, { status: 400 })
    }
    if (promoCode.endDate && now > promoCode.endDate) {
      return NextResponse.json({ error: "This code has expired" }, { status: 400 })
    }

    // Check max uses
    if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json({ error: "This code has reached its usage limit" }, { status: 400 })
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
        ? `${Number(promoCode.discountValue)}% discount applied`
        : `${Number(promoCode.discountValue).toFixed(2)}€ discount applied`,
    })
  } catch (error) {
    console.error("Error validating promo code:", error)
    return NextResponse.json({ error: "Error validating code" }, { status: 500 })
  }
}
