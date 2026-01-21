import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { DiscountBanner } from "@/components/discount-banner"
import { ProductDetailClient } from "./product-detail-client"

interface ProductDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      performers: {
        include: {
          performer: {
            select: {
              id: true,
              slug: true,
              name: true,
              profileImage: true,
            },
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
        take: 4,
      },
      // For VARIABLE products, get associated attributes
      attributes: {
        include: {
          attribute: true,
        },
        orderBy: { order: "asc" },
      },
      // Get variants with their attribute values to filter available options
      variants: {
        where: { isActive: true },
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
      },
    },
  })

  if (!product) {
    notFound()
  }

  // Get performer IDs for related products query
  const performerIds = product.performers.map((pp) => pp.performer.id)

  // Productos relacionados (misma categoría o performer)
  const relatedProducts = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      id: { not: product.id },
      OR: [
        performerIds.length > 0
          ? {
              performers: {
                some: {
                  performerId: { in: performerIds },
                },
              },
            }
          : {},
        product.ProductToCategory.length > 0
          ? {
              ProductToCategory: {
                some: {
                  categoryId: { in: product.ProductToCategory.map((c) => c.categoryId) },
                },
              },
            }
          : {},
      ].filter((obj) => Object.keys(obj).length > 0),
    },
    take: 4,
    include: {
      performers: {
        include: {
          performer: {
            select: { name: true, slug: true },
          },
        },
      },
    },
  })

  // Get all attribute value IDs actually used by this product's variants
  const usedAttributeValueIds = new Set<string>()
  const attributeValuesMap = new Map<string, Map<string, { id: string; value: string; slug: string; colorHex: string | null; imageUrl: string | null }>>()

  product.variants.forEach((variant) => {
    variant.attributeValues.forEach((av) => {
      usedAttributeValueIds.add(av.attributeValueId)
      const attrId = av.attributeValue.attribute.id

      if (!attributeValuesMap.has(attrId)) {
        attributeValuesMap.set(attrId, new Map())
      }

      const attrValues = attributeValuesMap.get(attrId)!
      if (!attrValues.has(av.attributeValueId)) {
        attrValues.set(av.attributeValueId, {
          id: av.attributeValue.id,
          value: av.attributeValue.value,
          slug: av.attributeValue.slug,
          colorHex: av.attributeValue.colorHex,
          imageUrl: av.attributeValue.imageUrl,
        })
      }
    })
  })

  // Transform attributes for the variant selector component - only include values used by variants
  const productAttributes = product.attributes
    .filter((pa) => attributeValuesMap.has(pa.attribute.id))
    .map((pa) => ({
      id: pa.attribute.id,
      name: pa.attribute.name,
      slug: pa.attribute.slug,
      type: pa.attribute.type as "SELECT" | "COLOR" | "IMAGE",
      values: Array.from(attributeValuesMap.get(pa.attribute.id)?.values() || []),
    }))

  // Calculate total stock from variants for VARIABLE products
  const totalVariantStock = product.productType === "VARIABLE"
    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
    : product.stock

  return (
    <main className="flex-1 flex flex-col bg-black text-white pt-[120px]">
      <div>
        <DiscountBanner />
      </div>

      <div className="w-full mx-auto px-4 md:px-8 mt-8 mb-12">
        {/* Categories */}
        {product.ProductToCategory.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {product.ProductToCategory.map(({ ShopCategory }) => (
              <Link
                key={ShopCategory.id}
                href={`/tienda?category=${ShopCategory.slug}`}
                className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                {ShopCategory.name}
              </Link>
            ))}
          </div>
        )}

        {/* Product Detail Client Component - handles images, variants, pricing dynamically */}
        <ProductDetailClient
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            sku: product.sku,
            description: product.description,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            stock: totalVariantStock,
            trackInventory: product.trackInventory,
            images: product.images,
            productType: product.productType as "SIMPLE" | "VARIABLE",
          }}
          attributes={productAttributes}
        />

        {/* Related Videos */}
        {product.VideoProduct.length > 0 && (
          <div className="mt-12 pt-6 border-t border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Aparece en estos videos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.VideoProduct.map(({ video }) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.slug}`}
                  className="group"
                >
                  <div className="relative aspect-video bg-gray-900 overflow-hidden mb-2">
                    {video.thumbnailUrl && (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="200px"
                      />
                    )}
                  </div>
                  <p className="text-sm text-white/80 line-clamp-1 group-hover:text-[#00B1DE] transition-colors">
                    {video.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Productos relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <Link
                  key={relProduct.id}
                  href={`/tienda/${relProduct.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[3/4] bg-gray-900 overflow-hidden mb-3">
                    {relProduct.images && relProduct.images.length > 0 ? (
                      <Image
                        src={relProduct.images[0]}
                        alt={relProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[60%] h-[50%] rounded-xl bg-gray-700" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium line-clamp-1 group-hover:text-[#00B1DE] transition-colors">
                    {relProduct.name}
                  </h3>
                  {relProduct.performers.length > 0 && (
                    <p className="text-xs text-white/60">
                      {relProduct.performers.map(pp => pp.performer.name).join(", ")}
                    </p>
                  )}
                  <p className="text-sm font-bold mt-1">{Number(relProduct.price).toFixed(2)}€</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
