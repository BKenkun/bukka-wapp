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
              },
            },
          },
        },
      },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: { items: { include: { product: true } } },
      })
    }

    // Transform cart items
    const items = cart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        slug: item.product.slug,
        name: item.product.name,
        price: Number(item.product.price),
        compareAtPrice: item.product.compareAtPrice
          ? Number(item.product.compareAtPrice)
          : null,
        imageUrl: item.product.images[0] || null,
        stock: item.product.stock,
        available: item.product.status === "ACTIVE" &&
          (!item.product.trackInventory || item.product.stock > 0),
      },
    }))

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    // Get user's subscription plan for discount
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscriptionPlan: true },
    })

    // Get subscription plan discount
    const discountPercent = user?.subscriptionPlan?.shopDiscount || 0
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

    const { productId, quantity } = validatedData.data

    // Verify product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true, stock: true, trackInventory: true },
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

    if (product.trackInventory && product.stock < quantity) {
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

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity

      if (product.trackInventory && product.stock < newQuantity) {
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

    // Check stock
    if (item.product.trackInventory && item.product.stock < quantity) {
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
