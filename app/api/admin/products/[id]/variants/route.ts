import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"


const variantSchema = z.object({
  sku: z.string().optional().nullable(),
  price: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  compareAtPrice: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  stock: z.number().default(0),
  imageUrl: z.string().optional().nullable(),
  weight: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  isActive: z.boolean().default(true),
  attributeValueIds: z.array(z.string()).min(1, "Debe tener al menos un valor de atributo"),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: productId } = await params

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      include: {
        attributeValues: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    // Transform to a cleaner format
    const transformedVariants = variants.map((v) => ({
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      imageUrl: v.imageUrl,
      weight: v.weight,
      isActive: v.isActive,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      attributes: v.attributeValues.map((av) => ({
        attributeId: av.attributeValue.attributeId,
        attributeName: av.attributeValue.attribute.name,
        valueId: av.attributeValueId,
        value: av.attributeValue.value,
        colorHex: av.attributeValue.colorHex,
      })),
    }))

    return NextResponse.json({ variants: transformedVariants })
  } catch (error) {
    console.error("Error fetching variants:", error)
    return NextResponse.json({ error: "Error al obtener variantes" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: productId } = await params
    const body = await request.json()
    const data = variantSchema.parse(body)

    // Verify product exists and is VARIABLE type
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    if (product.productType !== "VARIABLE") {
      return NextResponse.json(
        { error: "Solo productos de tipo VARIABLE pueden tener variantes" },
        { status: 400 }
      )
    }

    // Check if SKU is unique (if provided)
    if (data.sku) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku: data.sku },
      })
      if (existingSku) {
        return NextResponse.json({ error: "El SKU ya existe" }, { status: 400 })
      }
    }

    // Create variant with attribute values
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku: data.sku,
        price: (data.price),
        compareAtPrice: data.compareAtPrice ? (data.compareAtPrice) : null,
        stock: data.stock,
        imageUrl: data.imageUrl,
        weight: data.weight ? (data.weight) : null,
        isActive: data.isActive,
        attributeValues: {
          create: data.attributeValueIds.map((valueId) => ({
            attributeValueId: valueId,
          })),
        },
      },
      include: {
        attributeValues: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ variant })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating variant:", error)
    return NextResponse.json({ error: "Error al crear variante" }, { status: 500 })
  }
}
