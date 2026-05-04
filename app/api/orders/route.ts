import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendTemplateEmail, OrderConfirmationTemplate } from "@/lib/email"
import { clearCartSessionCookie, getCartSessionId } from "@/lib/cart-session"
import { createAdminNotification } from "@/lib/admin-notifications"
import { validateReferralCode } from "@/lib/referral-codes"

// GET - Listar órdenes del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const orderNumber = searchParams.get("orderNumber")

    const where = {
      userId: session.user.id,
      ...(status && { status: status as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" }),
      ...(orderNumber && { orderNumber }),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          OrderItem: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      total: Number(order.total),
      tierDiscountPercent: order.tierDiscountPercent,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt.toISOString(),
      items: order.OrderItem.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.product.id,
          slug: item.product.slug,
          name: item.product.name,
          imageUrl: item.product.images[0] || null,
        },
      })),
    }))

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Error fetching orders" },
      { status: 500 }
    )
  }
}

const shippingAddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
})

const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  sameAsBilling: z.boolean().default(true),
  shippingRateId: z.string().optional(),
  shippingMethod: z.string().optional(),
  shippingCost: z.number().min(0).default(0),
  promoCode: z.string().nullable().optional(),
  promoDiscount: z.number().min(0).default(0),
  referralCode: z.string().nullable().optional(),
  paymentGateway: z.string().optional(),
})

// POST - Crear orden desde el carrito (usuario o invitado)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id ?? null
    const cartSessionId = userId ? null : await getCartSessionId()

    if (!userId && !cartSessionId) {
      return NextResponse.json({ error: "Cart session unavailable" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createOrderSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { shippingAddress, billingAddress, sameAsBilling, shippingMethod, shippingCost, promoCode, promoDiscount, referralCode, paymentGateway } = validatedData.data

    // Get cart with items (by userId for logged-in, by sessionId for guests)
    const cart = await prisma.cart.findUnique({
      where: userId ? { userId } : { sessionId: cartSessionId! },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                trackInventory: true,
                status: true,
                riskLevel: true,
                productType: true,
              },
            },
            variant: {
              select: {
                id: true,
                price: true,
                stock: true,
                isActive: true,
                attributeValues: {
                  include: {
                    attributeValue: {
                      include: {
                        attribute: {
                          select: { name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (item.product.status !== "ACTIVE") {
        return NextResponse.json(
          { error: `Product "${item.product.name}" is not available` },
          { status: 400 }
        )
      }

      // For variable products, check variant availability and stock
      if (item.product.productType === "VARIABLE") {
        if (!item.variant) {
          return NextResponse.json(
            { error: `Variant required for "${item.product.name}"` },
            { status: 400 }
          )
        }
        if (!item.variant.isActive) {
          return NextResponse.json(
            { error: `Selected variant for "${item.product.name}" is no longer available` },
            { status: 400 }
          )
        }
        if (item.product.trackInventory && item.variant.stock < item.quantity) {
          return NextResponse.json(
            { error: `Not enough stock for "${item.product.name}"` },
            { status: 400 }
          )
        }
      } else {
        // Simple product stock check
        if (item.product.trackInventory && item.product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Not enough stock for "${item.product.name}"` },
            { status: 400 }
          )
        }
      }
    }

    // Get user's subscription plan for discount (only logged-in users get tier discounts)
    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          include: { SubscriptionPlan: true },
        })
      : null

    const discountPercent = user?.SubscriptionPlan?.shopDiscount || 0

    // Calculate totals - use variant price when applicable
    const subtotal = cart.items.reduce((sum, item) => {
      const itemPrice = item.variant ? Number(item.variant.price) : Number(item.product.price)
      return sum + itemPrice * item.quantity
    }, 0)
    const tierDiscount = (subtotal * discountPercent) / 100

    // Resolve referral code (if any) and compute its discount on subtotal-tier
    let referralCodeId: string | null = null
    let referralDiscountAmount = 0
    if (referralCode) {
      const baseForReferral = Math.max(0, subtotal - tierDiscount)
      const refResult = await validateReferralCode(referralCode, "shop", baseForReferral)
      if (refResult.ok && refResult.referral) {
        referralCodeId = refResult.referral.id
        referralDiscountAmount = refResult.discountAmount ?? 0
      }
    }

    const discount = tierDiscount + (promoDiscount || 0) + referralDiscountAmount
    const tax = 0 // Could calculate based on shipping address
    const shipping = shippingCost // Use shipping cost from request
    const total = Math.max(0, subtotal - discount + tax + shipping)

    // Validate and update promo code usage if provided
    if (promoCode) {
      const validPromo = await prisma.promoCode.findUnique({
        where: { code: promoCode },
      })

      if (validPromo && validPromo.isActive) {
        await prisma.promoCode.update({
          where: { id: validPromo.id },
          data: { usedCount: { increment: 1 } },
        })
      }
    }

    // Determine order risk level (highest risk of any product)
    const hasHighRisk = cart.items.some(
      (item) => item.product.riskLevel === "HIGH_RISK"
    )
    const riskLevel = hasHighRisk ? "HIGH_RISK" : "LOW_RISK"

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          guestEmail: userId ? null : shippingAddress.email,
          guestName: userId ? null : `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          subtotal,
          discount,
          tax,
          shipping,
          total,
          tierDiscountPercent: discountPercent,
          riskLevel: riskLevel as "LOW_RISK" | "HIGH_RISK",
          shippingAddress: shippingAddress as object,
          billingAddress: (sameAsBilling ? shippingAddress : billingAddress) as object,
          shippingMethod: shippingMethod || null,
          paymentGateway: paymentGateway || null,
          referralCodeId,
          OrderItem: {
            create: cart.items.map((item) => {
              // Build variant snapshot for variable products
              const variantSnapshot = item.variant
                ? Object.fromEntries(
                    item.variant.attributeValues.map((av) => [
                      av.attributeValue.attribute.name,
                      av.attributeValue.value,
                    ])
                  )
                : null

              // Use variant price if available
              const itemPrice = item.variant ? item.variant.price : item.product.price

              return {
                product: { connect: { id: item.product.id } },
                variant: item.variantId ? { connect: { id: item.variantId } } : undefined,
                quantity: item.quantity,
                price: itemPrice,
                variantSnapshot: variantSnapshot as any,
              }
            }),
          },
        },
        include: {
          OrderItem: {
            include: {
              product: {
                select: { id: true, name: true, images: true },
              },
            },
          },
        },
      })

      // Update stock for tracked inventory products
      for (const item of cart.items) {
        if (item.product.trackInventory) {
          if (item.variant) {
            // Decrement variant stock for variable products
            await tx.productVariant.update({
              where: { id: item.variant.id },
              data: { stock: { decrement: item.quantity } },
            })
          } else {
            // Decrement product stock for simple products
            await tx.product.update({
              where: { id: item.product.id },
              data: { stock: { decrement: item.quantity } },
            })
          }
        }
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      return newOrder
    })

    await createAdminNotification({
      type: "NEW_ORDER",
      title: `Nuevo pedido #${order.orderNumber}`,
      message: `${shippingAddress.firstName} ${shippingAddress.lastName} · ${Number(order.total).toFixed(2)} €`,
      relatedUrl: `/admin/orders/${order.id}`,
    })

    // Alerta de stock bajo: notificar cuando un producto/variante cruza
    // el umbral (antes > 5, ahora ≤ 5) o se queda a 0.
    for (const item of cart.items) {
      if (!item.product.trackInventory) continue
      const stockBefore = item.variant ? item.variant.stock : item.product.stock
      const stockAfter = stockBefore - item.quantity
      const crossedThreshold = stockBefore > 5 && stockAfter <= 5
      const outOfStock = stockAfter <= 0
      if (!crossedThreshold && !outOfStock) continue
      await createAdminNotification({
        type: "LOW_STOCK",
        title: outOfStock
          ? `Sin stock: ${item.product.name}`
          : `Stock bajo: ${item.product.name}`,
        message: outOfStock
          ? "Producto agotado tras este pedido"
          : `Quedan ${Math.max(0, stockAfter)} unidades`,
        relatedUrl: `/admin/products/${item.product.id}`,
      })
    }

    // Send order confirmation email (to user email or guest email from shipping form)
    const shippingAddr = shippingAddress
    const recipientEmail = user?.email || shippingAddr.email
    const recipientName = user?.name || shippingAddr.firstName

    await sendTemplateEmail({
      to: recipientEmail,
      template: "orders/confirmation",
      subjectVariables: { orderNumber: order.orderNumber },
      react: OrderConfirmationTemplate({
        customerName: recipientName,
        orderNumber: order.orderNumber,
        items: order.OrderItem.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
          imageUrl: item.product.images[0],
        })),
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        discount: Number(order.discount),
        total: Number(order.total),
        shippingAddress: {
          name: `${shippingAddr.firstName} ${shippingAddr.lastName}`,
          address: shippingAddr.address,
          city: shippingAddr.city,
          postalCode: shippingAddr.postalCode,
          country: shippingAddr.country,
        },
      }),
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    })

    // Clear guest cart cookie after successful order
    if (!userId) {
      await clearCartSessionCookie()
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Error creating order" },
      { status: 500 }
    )
  }
}
