import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductDetailClient } from "./product-detail-client"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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
      attributes: {
        include: {
          attribute: true,
        },
        orderBy: { order: "asc" },
      },
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

  const performerIds = product.performers.map((pp) => pp.performer.id)

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

  const productAttributes = product.attributes
    .filter((pa) => attributeValuesMap.has(pa.attribute.id))
    .map((pa) => ({
      id: pa.attribute.id,
      name: pa.attribute.name,
      slug: pa.attribute.slug,
      type: pa.attribute.type as "SELECT" | "COLOR" | "IMAGE",
      values: Array.from(attributeValuesMap.get(pa.attribute.id)?.values() || []),
    }))

  const totalVariantStock = product.productType === "VARIABLE"
    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
    : product.stock

  const firstCategory = product.ProductToCategory[0]?.ShopCategory

  return (
    <main className="flex-1 flex flex-col">
      <div className="w-full mx-auto px-4 md:px-8 mt-6 mb-12">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/tienda" style={{ color: "var(--text-muted)" }}>Shop</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {firstCategory && (
              <>
                <BreadcrumbSeparator style={{ color: "var(--text-muted)" }} />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/tienda?category=${firstCategory.slug}`}
                      style={{ color: "var(--text-muted)" }}
                    >
                      {firstCategory.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator style={{ color: "var(--text-muted)" }} />
            <BreadcrumbItem>
              <BreadcrumbPage style={{ color: "var(--text-primary)" }}>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Product Detail Client Component */}
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
          <div className="mt-12 pt-6" style={{ borderTop: `1px solid var(--border-color)` }}>
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}
            >
              Featured in these videos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.VideoProduct.map(({ video }) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.slug}`}
                  className="group"
                >
                  <div className="relative aspect-video overflow-hidden mb-2" style={{ backgroundColor: "var(--surface-bg)" }}>
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
                  <p
                    className="text-sm line-clamp-1 group-hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {video.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-6" style={{ borderTop: `1px solid var(--border-color)` }}>
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}
            >
              Related products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <Link
                  key={relProduct.id}
                  href={`/tienda/${relProduct.slug}`}
                  className="group"
                >
                  <div
                    className="relative aspect-[3/4] overflow-hidden mb-3"
                    style={{ backgroundColor: "var(--surface-bg)" }}
                  >
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
                        <div className="w-[60%] h-[50%] rounded-xl" style={{ backgroundColor: "var(--border-color)" }} />
                      </div>
                    )}
                  </div>
                  <h3
                    className="text-sm font-medium line-clamp-1 group-hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {relProduct.name}
                  </h3>
                  {relProduct.performers.length > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {relProduct.performers.map(pp => pp.performer.name).join(", ")}
                    </p>
                  )}
                  <p
                    className="text-sm font-bold mt-1"
                    style={{ color: "var(--cart-price, var(--brand-color))" }}
                  >
                    {Number(relProduct.price).toFixed(2)}€
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
