import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/products/[slug]/variant?values=valueId1,valueId2
// Returns the matching variant based on selected attribute values
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const valuesParam = searchParams.get("values")

    if (!valuesParam) {
      return NextResponse.json({ error: "Attribute values required" }, { status: 400 })
    }

    const valueIds = valuesParam.split(",").filter(Boolean)

    if (valueIds.length === 0) {
      return NextResponse.json({ error: "Attribute values required" }, { status: 400 })
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, productType: true },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (product.productType !== "VARIABLE") {
      return NextResponse.json({ error: "This product has no variants" }, { status: 400 })
    }

    // Find variant that matches ALL the selected attribute values
    const variants = await prisma.productVariant.findMany({
      where: {
        productId: product.id,
        isActive: true,
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

    // Find the variant that has exactly the requested attribute values
    const matchingVariant = variants.find((variant) => {
      const variantValueIds = variant.attributeValues.map((av) => av.attributeValueId)
      // Check if all requested values are in this variant
      // and this variant has exactly the number of attributes we're looking for
      return (
        valueIds.every((id) => variantValueIds.includes(id)) &&
        variantValueIds.length === valueIds.length
      )
    })

    if (!matchingVariant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    }

    // Format response - ensure Decimals are converted to numbers
    const response = {
      id: matchingVariant.id,
      sku: matchingVariant.sku,
      price: Number(matchingVariant.price),
      compareAtPrice: matchingVariant.compareAtPrice ? Number(matchingVariant.compareAtPrice) : null,
      stock: matchingVariant.stock,
      imageUrl: matchingVariant.imageUrl,
      isAvailable: matchingVariant.stock > 0,
      attributes: matchingVariant.attributeValues.map((av) => ({
        name: av.attributeValue.attribute.name,
        value: av.attributeValue.value,
        colorHex: av.attributeValue.colorHex,
      })),
    }

    return NextResponse.json({ variant: response })
  } catch (error) {
    console.error("Error fetching variant:", error)
    return NextResponse.json({ error: "Error fetching variant" }, { status: 500 })
  }
}
