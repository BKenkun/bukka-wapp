"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { VariantSelector } from "@/components/shop/variant-selector"

interface AttributeValue {
  id: string
  value: string
  slug: string
  colorHex: string | null
  imageUrl: string | null
}

interface Attribute {
  id: string
  name: string
  slug: string
  type: "SELECT" | "COLOR" | "IMAGE"
  values: AttributeValue[]
}

interface VariantInfo {
  id: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  imageUrl: string | null
  isAvailable: boolean
}

interface ProductDetailClientProps {
  product: {
    id: string
    slug: string
    name: string
    sku: string | null
    description: string | null
    price: number
    compareAtPrice: number | null
    stock: number
    trackInventory: boolean
    images: string[]
    productType: "SIMPLE" | "VARIABLE"
  }
  attributes: Attribute[]
}

export function ProductDetailClient({
  product,
  attributes,
}: ProductDetailClientProps) {
  const { data: session } = useSession()
  const router = useRouter()

  // Image state
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [displayImages, setDisplayImages] = React.useState<string[]>(
    product.images.length > 0 ? product.images : ["/images/placeholder-product.jpg"]
  )
  const [touchStart, setTouchStart] = React.useState(0)
  const [touchEnd, setTouchEnd] = React.useState(0)

  // Variant and price state
  const [selectedVariant, setSelectedVariant] = React.useState<VariantInfo | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [quantity, setQuantity] = React.useState(1)

  const isVariable = product.productType === "VARIABLE"

  // Current values based on selected variant or base product
  // Ensure prices are always numbers (API might return Decimal)
  const currentPrice = Number(isVariable && selectedVariant ? selectedVariant.price : product.price)
  const currentCompareAtPrice = isVariable && selectedVariant
    ? (selectedVariant.compareAtPrice ? Number(selectedVariant.compareAtPrice) : null)
    : product.compareAtPrice
  const currentStock = isVariable && selectedVariant ? selectedVariant.stock : product.stock
  const currentSku = isVariable && selectedVariant ? selectedVariant.sku : product.sku

  const hasDiscount = currentCompareAtPrice && currentCompareAtPrice > currentPrice
  const discountPercent = hasDiscount
    ? Math.round((1 - currentPrice / currentCompareAtPrice) * 100)
    : 0

  const isOutOfStock = isVariable
    ? !selectedVariant || !selectedVariant.isAvailable
    : product.trackInventory && product.stock === 0
  const maxQuantity = product.trackInventory ? currentStock : 99

  // Handle variant change - update image if variant has one
  const handleVariantChange = React.useCallback((variant: VariantInfo | null) => {
    setSelectedVariant(variant)
    setQuantity(1)

    if (variant?.imageUrl) {
      // If variant has an image, show it first followed by product images
      setDisplayImages([variant.imageUrl, ...product.images.filter(img => img !== variant.imageUrl)])
      setCurrentImageIndex(0)
    } else {
      // Reset to product images
      setDisplayImages(product.images.length > 0 ? product.images : ["/images/placeholder-product.jpg"])
      setCurrentImageIndex(0)
    }
  }, [product.images])

  // Image navigation
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) nextImage()
    if (touchStart - touchEnd < -75) prevImage()
  }

  // Add to cart
  const handleAddToCart = async () => {
    if (!session?.user) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    if (isVariable && !selectedVariant) {
      toast.error("Selecciona una variante")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          variantId: selectedVariant?.id || null,
        }),
      })

      if (res.ok) {
        toast.success("Producto añadido al carrito")
        window.dispatchEvent(new CustomEvent("cart-updated"))
      } else {
        const error = await res.json()
        toast.error(error.error || "Error al añadir al carrito")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Error al añadir al carrito")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Side - Image Slider */}
      <div className="space-y-4">
        {/* Main Image */}
        <div
          className="relative w-full aspect-square bg-white overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={displayImages[currentImageIndex]}
            alt={`${product.name} - Imagen ${currentImageIndex + 1}`}
            fill
            className="object-contain p-4"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Images */}
        {displayImages.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {displayImages.map((img, index) => (
              <button
                key={`${img}-${index}`}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative aspect-square overflow-hidden transition-all ${
                  index === currentImageIndex
                    ? "ring-2 ring-[var(--accent-color)]"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`${product.name} - Miniatura ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="100px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Side - Product Info */}
      <div className="flex flex-col space-y-6">
        {/* Title */}
        <h1
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--global-font)",
            fontSize: "30px",
            fontWeight: 700,
            lineHeight: "36px",
          }}
        >
          {product.name}
        </h1>

        {/* Stock Status */}
        {product.trackInventory && (
          <p
            style={{
              color: currentStock > 0 ? "var(--success-color)" : "var(--error-color)",
              fontFamily: "var(--global-font)",
              fontSize: "16px",
              fontWeight: 500,
              lineHeight: "24px",
            }}
          >
            {currentStock > 0
              ? currentStock <= 5
                ? `En stock - ¡Solo quedan ${currentStock}!`
                : "En stock"
              : "Agotado"}
          </p>
        )}

        {/* Description */}
        {product.description && (
          <p
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--global-font)",
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: "26px",
            }}
          >
            {product.description}
          </p>
        )}

        {/* Pricing - only show if has discount */}
        {hasDiscount && (
          <div className="flex items-baseline gap-3">
            <span
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--global-font)",
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              {currentPrice.toFixed(2)}€
            </span>
            <span
              className="line-through"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--global-font)",
                fontSize: "18px",
                fontWeight: 400,
              }}
            >
              {currentCompareAtPrice?.toFixed(2)}€
            </span>
            <span
              className="font-medium"
              style={{
                color: "var(--success-color)",
                fontFamily: "var(--global-font)",
                fontSize: "14px",
              }}
            >
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* Variant Selector */}
        {isVariable && attributes.length > 0 && (
          <div className="py-4">
            <VariantSelector
              productSlug={product.slug}
              attributes={attributes}
              basePrice={product.price}
              onVariantChange={handleVariantChange}
            />
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={loading || isOutOfStock}
          className="btn-primary text-center w-fit"
          style={isOutOfStock ? { backgroundColor: "color-mix(in srgb, var(--text-primary) 40%, transparent)" } : undefined}
        >
          {loading
            ? "Añadiendo..."
            : isOutOfStock
              ? isVariable && !selectedVariant
                ? "Selecciona opciones"
                : "Agotado"
              : "Añadir al carrito"}
        </button>
      </div>
    </div>
  )
}
