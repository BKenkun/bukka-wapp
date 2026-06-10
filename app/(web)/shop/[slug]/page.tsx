import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getShopSettings } from "@/lib/get-shop-settings"
import { ProductDetailClient } from "./product-detail-client"
import { ProductCard } from "@/components/shop/product-card"
import { ShopFaq } from "@/components/shop/shop-faq"
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

  const [product, shopSettings] = await Promise.all([
    prisma.product.findUnique({
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
    }),
    getShopSettings(),
  ])

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
      variants: {
        where: { isActive: true },
        select: { stock: true },
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
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto w-full px-6 mt-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shop" style={{ color: "var(--text-muted)" }}>Shop</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {firstCategory && (
              <>
                <BreadcrumbSeparator style={{ color: "var(--text-muted)" }} />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/tienda/categoria/${firstCategory.slug}`}
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
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto w-full px-6 mb-16">
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
          trustBadges={shopSettings.productDetail.trustBadges}
          trustBadgesStyles={shopSettings.productDetail.trustBadgesStyles}
          careInstructions={shopSettings.productDetail.careInstructions}
        />
      </div>

      {/* Description & Custom Content / Care Instructions */}
      {(() => {
        // Per-product metadata takes priority over global settings
        const productMeta = product.metadata as { customSectionTitle?: string; blocks?: Array<{ title: string; description: string }> } | null
        const hasProductBlocks = productMeta?.blocks && productMeta.blocks.length > 0
        const hasGlobalCare = shopSettings.productDetail.careInstructions.length > 0

        const customTitle = hasProductBlocks
          ? (productMeta?.customSectionTitle || "Product Details")
          : "Care Instructions"
        const contentBlocks = hasProductBlocks
          ? productMeta!.blocks!
          : hasGlobalCare
            ? shopSettings.productDetail.careInstructions
            : []

        const careStyles = shopSettings.productDetail.careInstructionsStyles

        if (!product.description && contentBlocks.length === 0) return null

        return (
          <section
            className="py-16"
            style={{ backgroundColor: careStyles?.bgColor || "var(--surface-bg, #f9fafb)" }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Description */}
                {product.description && (
                  <div>
                    <h2
                      className="text-2xl font-bold mb-6"
                      style={{ color: careStyles?.titleColor || "var(--text-primary, #000)" }}
                    >
                      Product Description
                    </h2>
                    <div
                      className="prose max-w-none"
                      style={{
                        color: careStyles?.textColor || "var(--text-muted, #6b7280)",
                        fontFamily: "var(--global-font)",
                        lineHeight: "1.8",
                      }}
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  </div>
                )}

                {/* Custom Content Blocks (per-product or global fallback) */}
                {contentBlocks.length > 0 && (
                  <div>
                    <h2
                      className="text-2xl font-bold mb-6"
                      style={{ color: careStyles?.titleColor || "var(--text-primary, #000)" }}
                    >
                      {customTitle}
                    </h2>
                    <div className="space-y-4">
                      {contentBlocks.map((block, index) => (
                        <div
                          key={index}
                          className="p-6 border"
                          style={{
                            borderColor: "var(--border-color, #e5e7eb)",
                            backgroundColor: careStyles?.cardBgColor || "var(--global-bg, #fff)",
                          }}
                        >
                          <h3
                            className="font-bold mb-2"
                            style={{ color: careStyles?.titleColor || "var(--text-primary, #000)" }}
                          >
                            {block.title}
                          </h3>
                          <p style={{ color: careStyles?.textColor || "var(--text-muted, #6b7280)" }}>
                            {block.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )
      })()}

      {/* Related Videos */}
      {product.VideoProduct.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2
              className="text-2xl font-bold mb-8"
              style={{ color: "var(--text-primary, #000)", fontFamily: "var(--global-font)" }}
            >
              Aparece en estos videos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {product.VideoProduct.map(({ video }) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.slug}`}
                  className="group"
                >
                  <div
                    className="relative aspect-video overflow-hidden mb-3"
                    style={{ backgroundColor: "var(--surface-bg, #f3f4f6)" }}
                  >
                    {video.thumbnailUrl && (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="200px"
                      />
                    )}
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-white/90 flex items-center justify-center">
                        <div
                          className="w-0 h-0 ml-1"
                          style={{
                            borderTop: "8px solid transparent",
                            borderBottom: "8px solid transparent",
                            borderLeft: "14px solid var(--brand-color, #E03E54)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <p
                    className="text-sm font-medium line-clamp-1 group-hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-primary, #000)" }}
                  >
                    {video.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16" style={{ backgroundColor: shopSettings.productDetail.relatedProductsStyles?.bgColor || "var(--surface-bg, #f9fafb)" }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2
              className="text-2xl md:text-3xl font-bold mb-8"
              style={{ color: shopSettings.productDetail.relatedProductsStyles?.titleColor || "var(--text-primary, #000)", fontFamily: "var(--global-font)" }}
            >
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => {
                const effectiveStock = relProduct.productType === "VARIABLE"
                  ? relProduct.variants.reduce((sum, v) => sum + v.stock, 0)
                  : relProduct.stock

                return (
                  <ProductCard
                    key={relProduct.id}
                    product={{
                      id: relProduct.id,
                      slug: relProduct.slug,
                      name: relProduct.name,
                      price: Number(relProduct.price),
                      compareAtPrice: relProduct.compareAtPrice ? Number(relProduct.compareAtPrice) : null,
                      images: relProduct.images,
                      stock: effectiveStock,
                      trackInventory: relProduct.trackInventory,
                      productType: relProduct.productType,
                      performers: relProduct.performers.map((pp) => pp.performer),
                      createdAt: relProduct.createdAt?.toISOString(),
                    }}
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Product FAQ */}
      <ShopFaq
        enabled={shopSettings.productDetail.faq.enabled}
        title="Frequently Asked Questions"
        items={shopSettings.productDetail.faq.items}
        bgColor={shopSettings.productDetail.faq.styles?.bgColor || undefined}
        titleColor={shopSettings.productDetail.faq.styles?.titleColor || undefined}
      />
    </main>
  )
}
