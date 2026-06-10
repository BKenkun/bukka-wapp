import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// PATCH - Actualizar producto (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { slug } = await params
    const body = await request.json()

    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const {
      name,
      slug: newSlug,
      description,
      price,
      compareAtPrice,
      sku,
      stock,
      trackInventory,
      images,
      status,
      riskLevel,
      performerIds,
      categoryIds,
      tagIds,
      productType,
      weight,
      metadata,
    } = body

    // Si cambia el slug, verificar que no exista
    if (newSlug && newSlug !== slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: newSlug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: "A product with that slug already exists" },
          { status: 400 }
        )
      }
    }

    // Si cambia el SKU, verificar que no exista
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      })
      if (skuExists) {
        return NextResponse.json(
          { error: "A product with that SKU already exists" },
          { status: 400 }
        )
      }
    }

    // Actualizar categorías
    if (categoryIds !== undefined) {
      await prisma.productToCategory.deleteMany({
        where: { productId: existingProduct.id },
      })

      if (categoryIds.length > 0) {
        await prisma.productToCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            productId: existingProduct.id,
            categoryId,
          })),
        })
      }
    }

    // Actualizar performers (many-to-many)
    if (performerIds !== undefined) {
      await prisma.productPerformer.deleteMany({
        where: { productId: existingProduct.id },
      })

      if (performerIds.length > 0) {
        await prisma.productPerformer.createMany({
          data: performerIds.map((performerId: string) => ({
            productId: existingProduct.id,
            performerId,
          })),
        })
      }
    }

    // Actualizar tags (many-to-many)
    if (tagIds !== undefined) {
      await prisma.productTag.deleteMany({
        where: { productId: existingProduct.id },
      })

      if (tagIds.length > 0) {
        await prisma.productTag.createMany({
          data: tagIds.map((tagId: string) => ({
            productId: existingProduct.id,
            tagId,
          })),
        })
      }
    }

    const product = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        name,
        slug: newSlug || slug,
        description,
        price,
        compareAtPrice,
        sku: sku || null,
        stock,
        trackInventory,
        images,
        status,
        riskLevel,
        productType: productType || undefined,
        weight: weight !== undefined ? weight : undefined,
        metadata: metadata !== undefined ? metadata : undefined,
      },
      include: {
        performers: {
          include: {
            performer: {
              select: { id: true, slug: true, name: true, profileImage: true },
            },
          },
        },
        ProductToCategory: { include: { ShopCategory: true } },
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Error updating product" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar producto (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: { slug },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    await prisma.product.delete({
      where: { id: product.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Error deleting product" },
      { status: 500 }
    )
  }
}

// GET - Obtener producto por slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        performers: {
          include: {
            performer: {
              select: { id: true, slug: true, name: true, profileImage: true },
            },
          },
        },
        ProductToCategory: {
          include: {
            ShopCategory: {
              select: { id: true, slug: true, name: true },
            },
          },
        },
        VideoProduct: {
          include: {
            video: {
              select: {
                id: true,
                slug: true,
                title: true,
                thumbnailUrl: true,
              },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      sku: product.sku,
      stock: product.stock,
      trackInventory: product.trackInventory,
      images: product.images,
      riskLevel: product.riskLevel,
      status: product.status,
      performers: product.performers.map((pp) => pp.performer),
      categories: product.ProductToCategory.map((pc) => pc.ShopCategory),
      relatedVideos: product.VideoProduct.map((pv) => pv.video),
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Error fetching product" },
      { status: 500 }
    )
  }
}
