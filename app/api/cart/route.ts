import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// GET - Obtener carrito del usuario
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                price: true,
                compareAtPrice: true,
                images: true,
                stock: true,
                trackInventory: true,
                status: true,
                productType: true,
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                price: true,
                compareAtPrice: true,
                stock: true,
                imageUrl: true,
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

    if (!cart) {
      // Create cart with same include structure as findUnique
      const newCart = await prisma.cart.create({
        data: { userId: session.user.id },
      })
      // Return empty cart immediately since it has no items
      return NextResponse.json({
        cart: {
          id: newCart.id,
          items: [],
          itemCount: 0,
          subtotal: 0,
          discount: 0,
          discountPercent: 0,
          total: 0,
        },
      })
    }

    // Transform cart items
    const items = cart.items.map((item) => {
      const hasVariant = item.variant !== null
      const variant = item.variant

      // Build variant label like "Talla: M, Color: Rojo"
      const variantLabel = variant
        ? variant.attributeValues
            .map((av) => `${av.attributeValue.attribute.name}: ${av.attributeValue.value}`)
            .join(", ")
        : null

      // Use variant price/stock if available
      const price = hasVariant ? Number(variant!.price) : Number(item.product.price)
      const compareAtPrice = hasVariant
        ? variant!.compareAtPrice ? Number(variant!.compareAtPrice) : null
        : item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null
      const stock = hasVariant ? variant!.stock : item.product.stock
      const imageUrl = hasVariant && variant!.imageUrl
        ? variant!.imageUrl
        : item.product.images[0] || null

      // Check availability
      const isAvailable = item.product.status === "ACTIVE" &&
        (!item.product.trackInventory || stock > 0) &&
        (!hasVariant || variant!.isActive)

      return {
        id: item.id,
        quantity: item.quantity,
        variantId: item.variantId,
        variantLabel,
        product: {
          id: item.product.id,
          slug: item.product.slug,
          name: item.product.name,
          price,
          compareAtPrice,
          imageUrl,
          stock,
          available: isAvailable,
          productType: item.product.productType,
        },
      }
    })

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    // Get user's subscription plan for discount
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { SubscriptionPlan: true },
    })

    // Get subscription plan discount
    const discountPercent = user?.SubscriptionPlan?.shopDiscount || 0
    const discount = (subtotal * discountPercent) / 100
    const total = subtotal - discount

    return NextResponse.json({
      cart: {
        id: cart.id,
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        discount,
        discountPercent,
        total,
      },
    })
  } catch (error) {
    console.error("Error fetching cart:", error)
    return NextResponse.json(
      { error: "Error fetching cart" },
      { status: 500 }
    )
  }
}

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).default(1),
  variantId: z.string().nullable().optional(),
})

// POST - Añadir item al carrito
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = addToCartSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { productId, quantity, variantId } = validatedData.data

    // Verify product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        status: true,
        stock: true,
        trackInventory: true,
        productType: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (product.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Product not available" },
        { status: 400 }
      )
    }

    // For VARIABLE products, require a variant
    if (product.productType === "VARIABLE" && !variantId) {
      return NextResponse.json(
        { error: "Variant required for this product" },
        { status: 400 }
      )
    }

    // If variantId provided, verify it exists and belongs to this product
    let variant = null
    if (variantId) {
      variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true, productId: true, stock: true, isActive: true },
      })

      if (!variant || variant.productId !== productId) {
        return NextResponse.json(
          { error: "Variant not found" },
          { status: 404 }
        )
      }

      if (!variant.isActive) {
        return NextResponse.json(
          { error: "Variant not available" },
          { status: 400 }
        )
      }
    }

    // Check stock - use variant stock for variable products, product stock for simple
    const stockToCheck = variant ? variant.stock : product.stock
    if (product.trackInventory && stockToCheck < quantity) {
      return NextResponse.json(
        { error: "Not enough stock" },
        { status: 400 }
      )
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      })
    }

    // Check if item already in cart (same product + variant combination)
    const actualVariantId = variantId ?? null
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: actualVariantId,
      },
    })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity

      if (product.trackInventory && stockToCheck < newQuantity) {
        return NextResponse.json(
          { error: "Not enough stock" },
          { status: 400 }
        )
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      })
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: actualVariantId,
          quantity,
        },
      })
    }

    return NextResponse.json({ message: "Added to cart" }, { status: 201 })
  } catch (error) {
    console.error("Error adding to cart:", error)
    return NextResponse.json(
      { error: "Error adding to cart" },
      { status: 500 }
    )
  }
}

const updateCartSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(0),
})

// PATCH - Actualizar cantidad de item
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateCartSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { itemId, quantity } = validatedData.data

    // Verify item belongs to user's cart
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: { select: { userId: true } },
        product: { select: { stock: true, trackInventory: true } },
        variant: { select: { stock: true } },
      },
    })

    if (!item || item.cart.userId !== session.user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (quantity === 0) {
      // Remove item
      await prisma.cartItem.delete({ where: { id: itemId } })
      return NextResponse.json({ message: "Item removed" })
    }

    // Check stock - use variant stock if available
    const stockToCheck = item.variant ? item.variant.stock : item.product.stock
    if (item.product.trackInventory && stockToCheck < quantity) {
      return NextResponse.json(
        { error: "Not enough stock" },
        { status: 400 }
      )
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    })

    return NextResponse.json({ message: "Cart updated" })
  } catch (error) {
    console.error("Error updating cart:", error)
    return NextResponse.json(
      { error: "Error updating cart" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar item del carrito
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      )
    }

    // Verify item belongs to user's cart
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { select: { userId: true } } },
    })

    if (!item || item.cart.userId !== session.user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    await prisma.cartItem.delete({ where: { id: itemId } })

    return NextResponse.json({ message: "Item removed" })
  } catch (error) {
    console.error("Error removing item:", error)
    return NextResponse.json(
      { error: "Error removing item" },
      { status: 500 }
    )
  }
}
