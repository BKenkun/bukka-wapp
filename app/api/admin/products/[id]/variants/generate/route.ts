import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"


const generateSchema = z.object({
  attributeIds: z.array(z.string()).min(1, "Selecciona al menos un atributo"),
  basePrice: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  baseStock: z.number().default(0),
})

// Generate all combinations of attribute values (cartesian product)
function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]]
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((combo) => curr.map((item) => [...combo, item])),
    [[]]
  )
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
    const data = generateSchema.parse(body)

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    // Update product type to VARIABLE if not already
    if (product.productType !== "VARIABLE") {
      await prisma.product.update({
        where: { id: productId },
        data: { productType: "VARIABLE" },
      })
    }

    // Get attributes with their active values
    const attributes = await prisma.attribute.findMany({
      where: {
        id: { in: data.attributeIds },
        isActive: true,
      },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    })

    if (attributes.length === 0) {
      return NextResponse.json({ error: "No se encontraron atributos activos" }, { status: 400 })
    }

    // Create or update ProductAttribute associations
    for (let i = 0; i < attributes.length; i++) {
      await prisma.productAttribute.upsert({
        where: {
          productId_attributeId: {
            productId,
            attributeId: attributes[i].id,
          },
        },
        create: {
          productId,
          attributeId: attributes[i].id,
          order: i,
        },
        update: {
          order: i,
        },
      })
    }

    // Get existing variants to avoid duplicates
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId },
      include: {
        attributeValues: true,
      },
    })

    // Create a key for each existing variant's attribute combination
    const existingCombinations = new Set(
      existingVariants.map((v) =>
        v.attributeValues
          .map((av) => av.attributeValueId)
          .sort()
          .join(",")
      )
    )

    // Generate all possible combinations
    const valueArrays = attributes.map((attr) => attr.values.map((v) => v.id))
    const combinations = cartesianProduct(valueArrays)

    // Filter out existing combinations
    const newCombinations = combinations.filter(
      (combo) => !existingCombinations.has(combo.sort().join(","))
    )

    if (newCombinations.length === 0) {
      return NextResponse.json({
        message: "Todas las combinaciones ya existen",
        created: 0,
        total: existingVariants.length,
      })
    }

    // Create new variants
    const createdVariants = []
    for (const combo of newCombinations) {
      const variant = await prisma.productVariant.create({
        data: {
          productId,
          price: (data.basePrice),
          stock: data.baseStock,
          isActive: true,
          attributeValues: {
            create: combo.map((valueId) => ({
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
      createdVariants.push(variant)
    }

    return NextResponse.json({
      message: `Se crearon ${createdVariants.length} variantes`,
      created: createdVariants.length,
      total: existingVariants.length + createdVariants.length,
      variants: createdVariants,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error generating variants:", error)
    return NextResponse.json({ error: "Error al generar variantes" }, { status: 500 })
  }
}
