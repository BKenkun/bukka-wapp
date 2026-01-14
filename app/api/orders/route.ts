import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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

    const where = {
      userId: session.user.id,
      ...(status && { status: status as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" }),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
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
      items: order.items.map((item) => ({
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
})

// POST - Crear orden desde el carrito
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createOrderSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { shippingAddress, billingAddress, sameAsBilling, shippingMethod, shippingCost } = validatedData.data

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
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

    // Get user's subscription plan for discount
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { SubscriptionPlan: true },
    })

    const discountPercent = user?.SubscriptionPlan?.shopDiscount || 0

    // Calculate totals - use variant price when applicable
    const subtotal = cart.items.reduce((sum, item) => {
      const itemPrice = item.variant ? Number(item.variant.price) : Number(item.product.price)
      return sum + itemPrice * item.quantity
    }, 0)
    const discount = (subtotal * discountPercent) / 100
    const tax = 0 // Could calculate based on shipping address
    const shipping = shippingCost // Use shipping cost from request
    const total = subtotal - discount + tax + shipping

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
          userId: session.user.id,
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
          items: {
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
                productId: item.product.id,
                variantId: item.variantId || null,
                quantity: item.quantity,
                price: itemPrice,
                variantSnapshot: variantSnapshot,
              }
            }),
          },
        },
        include: {
          items: {
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
