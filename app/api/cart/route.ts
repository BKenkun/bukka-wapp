import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  ensureCartSessionId,
  getCartSessionId,
} from "@/lib/cart-session"

type CartOwner =
  | { userId: string; sessionId: null }
  | { userId: null; sessionId: string }

async function resolveCartOwner(create: boolean): Promise<CartOwner | null> {
  const session = await auth()
  if (session?.user?.id) {
    return { userId: session.user.id, sessionId: null }
  }
  const sessionId = create ? await ensureCartSessionId() : await getCartSessionId()
  if (!sessionId) return null
  return { userId: null, sessionId }
}

async function findCart(owner: CartOwner) {
  if (owner.userId !== null) {
    return prisma.cart.findUnique({ where: { userId: owner.userId } })
  }
  return prisma.cart.findUnique({ where: { sessionId: owner.sessionId } })
}

async function findOrCreateCart(owner: CartOwner) {
  const existing = await findCart(owner)
  if (existing) return existing
  return prisma.cart.create({
    data:
      owner.userId !== null
        ? { userId: owner.userId }
        : { sessionId: owner.sessionId },
  })
}

// GET - Obtener carrito del usuario o invitado
export async function GET() {
  try {
    const owner = await resolveCartOwner(false)
    if (!owner) {
      return NextResponse.json({
        cart: {
          id: null,
          items: [],
          itemCount: 0,
          subtotal: 0,
          discount: 0,
          discountPercent: 0,
          total: 0,
        },
      })
    }

    const cart = await prisma.cart.findUnique({
      where: owner.userId ? { userId: owner.userId } : { sessionId: owner.sessionId! },
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
      return NextResponse.json({
        cart: {
          id: null,
          items: [],
          itemCount: 0,
          subtotal: 0,
          discount: 0,
          discountPercent: 0,
          total: 0,
        },
      })
    }

    const items = cart.items.map((item) => {
      const hasVariant = item.variant !== null
      const variant = item.variant
      const variantLabel = variant
        ? variant.attributeValues
            .map((av) => `${av.attributeValue.attribute.name}: ${av.attributeValue.value}`)
            .join(", ")
        : null

      const price = hasVariant ? Number(variant!.price) : Number(item.product.price)
      const compareAtPrice = hasVariant
        ? variant!.compareAtPrice
          ? Number(variant!.compareAtPrice)
          : null
        : item.product.compareAtPrice
          ? Number(item.product.compareAtPrice)
          : null
      const stock = hasVariant ? variant!.stock : item.product.stock
      const imageUrl = hasVariant && variant!.imageUrl
        ? variant!.imageUrl
        : item.product.images[0] || null

      const isAvailable =
        item.product.status === "ACTIVE" &&
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

    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    let discountPercent = 0
    if (owner.userId) {
      const user = await prisma.user.findUnique({
        where: { id: owner.userId },
        include: { SubscriptionPlan: true },
      })
      discountPercent = user?.SubscriptionPlan?.shopDiscount || 0
    }
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
    return NextResponse.json({ error: "Error fetching cart" }, { status: 500 })
  }
}

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).default(1),
  variantId: z.string().nullable().optional(),
})

// POST - Añadir item al carrito (permitido como invitado)
export async function POST(request: NextRequest) {
  try {
    const owner = await resolveCartOwner(true)
    if (!owner) {
      return NextResponse.json({ error: "Cart session unavailable" }, { status: 400 })
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
      return NextResponse.json({ error: "Product not available" }, { status: 400 })
    }

    if (product.productType === "VARIABLE" && !variantId) {
      return NextResponse.json(
        { error: "Variant required for this product" },
        { status: 400 }
      )
    }

    let variant = null
    if (variantId) {
      variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true, productId: true, stock: true, isActive: true },
      })

      if (!variant || variant.productId !== productId) {
        return NextResponse.json({ error: "Variant not found" }, { status: 404 })
      }

      if (!variant.isActive) {
        return NextResponse.json({ error: "Variant not available" }, { status: 400 })
      }
    }

    const stockToCheck = variant ? variant.stock : product.stock
    if (product.trackInventory && stockToCheck < quantity) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 })
    }

    const cart = await findOrCreateCart(owner)

    const actualVariantId = variantId ?? null
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: actualVariantId,
      },
    })

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (product.trackInventory && stockToCheck < newQuantity) {
        return NextResponse.json({ error: "Not enough stock" }, { status: 400 })
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      })
    } else {
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
    return NextResponse.json({ error: "Error adding to cart" }, { status: 500 })
  }
}

const updateCartSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(0),
})

// PATCH - Actualizar cantidad de item
export async function PATCH(request: NextRequest) {
  try {
    const owner = await resolveCartOwner(false)
    if (!owner) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
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

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: { select: { userId: true, sessionId: true } },
        product: { select: { stock: true, trackInventory: true } },
        variant: { select: { stock: true } },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const belongs =
      (owner.userId && item.cart.userId === owner.userId) ||
      (owner.sessionId && item.cart.sessionId === owner.sessionId)
    if (!belongs) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: itemId } })
      return NextResponse.json({ message: "Item removed" })
    }

    const stockToCheck = item.variant ? item.variant.stock : item.product.stock
    if (item.product.trackInventory && stockToCheck < quantity) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 })
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    })

    return NextResponse.json({ message: "Cart updated" })
  } catch (error) {
    console.error("Error updating cart:", error)
    return NextResponse.json({ error: "Error updating cart" }, { status: 500 })
  }
}

// DELETE - Eliminar item del carrito
export async function DELETE(request: NextRequest) {
  try {
    const owner = await resolveCartOwner(false)
    if (!owner) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 })
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { select: { userId: true, sessionId: true } } },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const belongs =
      (owner.userId && item.cart.userId === owner.userId) ||
      (owner.sessionId && item.cart.sessionId === owner.sessionId)
    if (!belongs) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    await prisma.cartItem.delete({ where: { id: itemId } })

    return NextResponse.json({ message: "Item removed" })
  } catch (error) {
    console.error("Error removing item:", error)
    return NextResponse.json({ error: "Error removing item" }, { status: 500 })
  }
}
