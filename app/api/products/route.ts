import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// POST - Crear producto (admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      name,
      slug,
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

    // Verificar slug único
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with that slug already exists" },
        { status: 400 }
      )
    }

    // Verificar SKU único si se proporciona
    if (sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku },
      })
      if (existingSku) {
        return NextResponse.json(
          { error: "A product with that SKU already exists" },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        compareAtPrice,
        sku: sku || null,
        stock: stock || 0,
        trackInventory: trackInventory ?? true,
        images: images || [],
        status: status || "DRAFT",
        riskLevel: riskLevel || "LOW_RISK",
        productType: productType || "SIMPLE",
        weight: weight || null,
        metadata: metadata || undefined,
        performers: performerIds?.length
          ? {
              create: performerIds.map((performerId: string) => ({
                performer: { connect: { id: performerId } },
              })),
            }
          : undefined,
        ProductToCategory: categoryIds?.length
          ? {
              create: categoryIds.map((categoryId: string) => ({
                ShopCategory: { connect: { id: categoryId } },
              })),
            }
          : undefined,
        ProductTag: tagIds?.length
          ? {
              create: tagIds.map((tagId: string) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    )
  }
}

// GET - Listar productos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const skip = (page - 1) * limit

    const categorySlug = searchParams.get("category")
    const performerSlug = searchParams.get("performer")
    const riskLevel = searchParams.get("riskLevel")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sort") || "createdAt"
    const sortOrder = searchParams.get("order") || "desc"

    const where: Record<string, unknown> = {
      status: "ACTIVE",
    }

    if (categorySlug) {
      where.ProductToCategory = {
        some: {
          ShopCategory: { slug: categorySlug },
        },
      }
    }

    if (performerSlug) {
      where.performers = {
        some: {
          performer: { slug: performerSlug },
        },
      }
    }

    if (riskLevel) {
      where.riskLevel = riskLevel
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const orderBy: Record<string, string> = {}
    if (sortBy === "price") {
      orderBy.price = sortOrder
    } else if (sortBy === "name") {
      orderBy.name = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
        },
      }),
      prisma.product.count({ where }),
    ])

    const transformedProducts = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      images: product.images,
      stock: product.stock,
      trackInventory: product.trackInventory,
      riskLevel: product.riskLevel,
      performers: product.performers.map((pp) => pp.performer),
      categories: product.ProductToCategory.map((pc) => pc.ShopCategory),
    }))

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Error fetching products" },
      { status: 500 }
    )
  }
}
