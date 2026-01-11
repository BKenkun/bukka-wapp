import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { DiscountBanner } from "@/components/discount-banner"
import { ProductImageSlider } from "./product-image-slider"
import { ProductAddToCart } from "./product-add-to-cart"

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
      performer: {
        select: {
          id: true,
          slug: true,
          name: true,
          profileImage: true,
        },
      },
      categories: {
        include: {
          category: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
      videos: {
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
    },
  })

  if (!product) {
    notFound()
  }

  // Productos relacionados (misma categoría o performer)
  const relatedProducts = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      id: { not: product.id },
      OR: [
        product.performerId ? { performerId: product.performerId } : {},
        product.categories.length > 0
          ? {
              categories: {
                some: {
                  categoryId: { in: product.categories.map((c) => c.categoryId) },
                },
              },
            }
          : {},
      ].filter((obj) => Object.keys(obj).length > 0),
    },
    take: 4,
    include: {
      performer: {
        select: { name: true },
      },
    },
  })

  const images = product.images && product.images.length > 0
    ? product.images
    : ["/images/placeholder-product.jpg"]

  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)
    : 0

  return (
    <main className="flex-1 flex flex-col bg-black text-white">
      <div>
        <DiscountBanner />
      </div>

      <div className="w-full mx-auto px-4 md:px-8 mt-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Image Slider */}
          <ProductImageSlider images={images} productName={product.name} />

          {/* Right Side - Product Info */}
          <div className="flex flex-col space-y-6">
            {/* Categories */}
            {product.categories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {product.categories.map(({ category }) => (
                  <Link
                    key={category.id}
                    href={`/tienda?category=${category.slug}`}
                    className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1
              className="text-[#E5E7EB]"
              style={{
                fontFamily: "Montserrat",
                fontSize: "30px",
                fontWeight: 700,
                lineHeight: "36px",
              }}
            >
              {product.name}
            </h1>

            {/* SKU */}
            {product.sku && (
              <p
                className="text-white/60"
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "14px",
                  fontWeight: 400,
                }}
              >
                SKU: {product.sku}
              </p>
            )}

            {/* Performer Badge */}
            {product.performer && (
              <Link
                href={`/modelos/${product.performer.slug}`}
                className="flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 transition-colors w-fit"
              >
                {product.performer.profileImage && (
                  <Image
                    src={product.performer.profileImage}
                    alt={product.performer.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-xs text-white/60">Producto de</p>
                  <p className="text-sm font-medium text-[#00B1DE]">{product.performer.name}</p>
                </div>
              </Link>
            )}

            {/* Pricing */}
            <div className="flex items-baseline gap-3">
              <span
                className="text-white"
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "32px",
                  fontWeight: 700,
                }}
              >
                {Number(product.price).toFixed(2)}€
              </span>
              {hasDiscount && (
                <>
                  <span
                    className="text-white/50 line-through"
                    style={{
                      fontFamily: "Montserrat",
                      fontSize: "20px",
                      fontWeight: 400,
                    }}
                  >
                    {Number(product.compareAtPrice).toFixed(2)}€
                  </span>
                  <span
                    className="text-[#16A34A] font-medium"
                    style={{
                      fontFamily: "Montserrat",
                      fontSize: "16px",
                    }}
                  >
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            {product.trackInventory && (
              <p
                className={product.stock > 0 ? "text-[#16A34A]" : "text-[#DC2626]"}
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                {product.stock > 0
                  ? product.stock <= 3
                    ? `En stock - ¡Solo quedan ${product.stock}!`
                    : "En stock"
                  : "Agotado"}
              </p>
            )}

            {/* Description */}
            {product.description && (
              <div
                className="text-white/90"
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "16px",
                  fontWeight: 400,
                  lineHeight: "26px",
                }}
              >
                {product.description.split("\n").map((paragraph, i) => (
                  <p key={i} className="mb-3">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {/* Add to Cart Button */}
            <ProductAddToCart
              productId={product.id}
              stock={product.stock}
              trackInventory={product.trackInventory}
            />

            {/* Related Videos */}
            {product.videos.length > 0 && (
              <div className="pt-6 border-t border-gray-800">
                <h3 className="text-lg font-semibold mb-4">Aparece en estos videos</h3>
                <div className="grid grid-cols-2 gap-4">
                  {product.videos.map(({ video }) => (
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
          </div>
        </div>

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
                  {relProduct.performer && (
                    <p className="text-xs text-white/60">{relProduct.performer.name}</p>
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
