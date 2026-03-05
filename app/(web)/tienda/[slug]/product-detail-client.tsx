"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, Lock, Truck, ShieldCheck, Plus, Minus } from "lucide-react"
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

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [lightboxIndex, setLightboxIndex] = React.useState(0)

  // Variant and price state
  const [selectedVariant, setSelectedVariant] = React.useState<VariantInfo | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [quantity, setQuantity] = React.useState(1)

  const isVariable = product.productType === "VARIABLE"

  // Current values based on selected variant or base product
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

  // Handle variant change
  const handleVariantChange = React.useCallback((variant: VariantInfo | null) => {
    setSelectedVariant(variant)
    setQuantity(1)

    if (variant?.imageUrl) {
      setDisplayImages([variant.imageUrl, ...product.images.filter(img => img !== variant.imageUrl)])
      setCurrentImageIndex(0)
    } else {
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

  // Lightbox
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  React.useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev + 1) % displayImages.length)
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [lightboxOpen, displayImages.length])

  // Add to cart
  const handleAddToCart = async () => {
    if (!session?.user) {
      router.push("/?login=true")
      return
    }

    if (isVariable && !selectedVariant) {
      toast.error("Please select a variant")
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
        toast.success("Added to cart")
        window.dispatchEvent(new CustomEvent("cart-updated"))
      } else {
        const error = await res.json()
        toast.error(error.error || "Error adding to cart")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Error adding to cart")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Side - Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div
            className="relative w-full aspect-square overflow-hidden cursor-zoom-in"
            style={{ backgroundColor: "var(--surface-bg)" }}
            onClick={() => openLightbox(currentImageIndex)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={displayImages[currentImageIndex]}
              alt={`${product.name} - Image ${currentImageIndex + 1}`}
              fill
              className="object-contain p-4"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />

            {/* Navigation Arrows */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage() }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                  style={{ backgroundColor: "color-mix(in srgb, var(--text-primary) 15%, transparent)", color: "var(--text-primary)" }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage() }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                  style={{ backgroundColor: "color-mix(in srgb, var(--text-primary) 15%, transparent)", color: "var(--text-primary)" }}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image counter */}
            {displayImages.length > 1 && (
              <span
                className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded"
                style={{ backgroundColor: "color-mix(in srgb, var(--text-primary) 15%, transparent)", color: "var(--text-primary)" }}
              >
                {currentImageIndex + 1} / {displayImages.length}
              </span>
            )}
          </div>

          {/* Thumbnail Images */}
          {displayImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {displayImages.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  onClick={() => setCurrentImageIndex(index)}
                  className="relative aspect-square overflow-hidden transition-all"
                  style={{
                    outline: index === currentImageIndex ? "2px solid var(--brand-color)" : "2px solid transparent",
                    outlineOffset: "-2px",
                    opacity: index === currentImageIndex ? 1 : 0.6,
                  }}
                >
                  <Image
                    src={img}
                    alt={`${product.name} - Thumbnail ${index + 1}`}
                    fill
                    className="object-cover hover:opacity-100 transition-opacity"
                    sizes="100px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side - Product Info */}
        <div className="flex flex-col">
          {/* Title */}
          <h1
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--global-font)",
              fontSize: "28px",
              fontWeight: 700,
              lineHeight: "34px",
            }}
          >
            {product.name}
          </h1>

          {/* SKU */}
          {currentSku && (
            <p className="mt-2" style={{ color: "var(--text-muted)", fontFamily: "var(--global-font)", fontSize: "13px" }}>
              SKU: {currentSku}
            </p>
          )}

          {/* Price - Always visible */}
          <div className="mt-4 flex items-baseline gap-3">
            <span
              style={{
                color: "var(--cart-price, var(--brand-color))",
                fontFamily: "var(--global-font)",
                fontSize: "32px",
                fontWeight: 700,
                lineHeight: "1",
              }}
            >
              {currentPrice.toFixed(2)}€
            </span>
            {hasDiscount && (
              <>
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
                  className="text-sm font-semibold px-2 py-0.5"
                  style={{
                    color: "#FFFFFF",
                    backgroundColor: "var(--brand-color)",
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
              className="mt-3"
              style={{
                color: currentStock > 0 ? "var(--success-color)" : "var(--error-color)",
                fontFamily: "var(--global-font)",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {currentStock > 0
                ? currentStock <= 5
                  ? `In stock — Only ${currentStock} left!`
                  : "In stock"
                : "Out of stock"}
            </p>
          )}

          {/* Separator */}
          <div className="my-5" style={{ height: "1px", backgroundColor: "var(--border-color)" }} />

          {/* Description */}
          {product.description && (
            <div
              className="mb-5"
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--global-font)",
                fontSize: "15px",
                fontWeight: 400,
                lineHeight: "24px",
              }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {/* Variant Selector */}
          {isVariable && attributes.length > 0 && (
            <div className="mb-5">
              <VariantSelector
                productSlug={product.slug}
                attributes={attributes}
                basePrice={product.price}
                onVariantChange={handleVariantChange}
              />
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4 mb-6">
            {/* Quantity Selector */}
            <div
              className="flex items-center h-[48px]"
              style={{ border: `1px solid var(--cart-qty-border, var(--border-color))` }}
            >
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-10 h-full flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ color: "var(--text-primary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--cart-qty-btn-hover, var(--surface-bg))" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span
                className="w-12 h-full flex items-center justify-center text-center font-medium"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--global-font)",
                  fontSize: "16px",
                  borderLeft: `1px solid var(--cart-qty-border, var(--border-color))`,
                  borderRight: `1px solid var(--cart-qty-border, var(--border-color))`,
                }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                className="w-10 h-full flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ color: "var(--text-primary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--cart-qty-btn-hover, var(--surface-bg))" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={loading || isOutOfStock}
              className="btn-primary text-center flex-1 h-[48px]"
              style={isOutOfStock ? { backgroundColor: "color-mix(in srgb, var(--text-primary) 40%, transparent)" } : undefined}
            >
              {loading
                ? "Adding..."
                : isOutOfStock
                  ? isVariable && !selectedVariant
                    ? "Select options"
                    : "Out of stock"
                  : `Add to cart — ${(currentPrice * quantity).toFixed(2)}€`}
            </button>
          </div>

          {/* Trust Badges */}
          <div
            className="grid grid-cols-3 gap-4 py-5"
            style={{ borderTop: `1px solid var(--border-color)`, borderBottom: `1px solid var(--border-color)` }}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <Lock className="w-5 h-5" style={{ color: "var(--cart-trust-badge, var(--text-muted))" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--cart-trust-badge, var(--text-muted))", fontFamily: "var(--global-font)" }}
              >
                Secure Payment
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <Truck className="w-5 h-5" style={{ color: "var(--cart-trust-badge, var(--text-muted))" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--cart-trust-badge, var(--text-muted))", fontFamily: "var(--global-font)" }}
              >
                Safe Shipping
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <ShieldCheck className="w-5 h-5" style={{ color: "var(--cart-trust-badge, var(--text-muted))" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--cart-trust-badge, var(--text-muted))", fontFamily: "var(--global-font)" }}
              >
                Guarantee
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full transition-colors z-10"
            style={{ color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.1)" }}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev */}
          {displayImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-colors z-10"
              style={{ color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.1)" }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-[90vw] h-[80vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayImages[lightboxIndex]}
              alt={`${product.name} - Image ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Next */}
          {displayImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % displayImages.length) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-colors z-10"
              style={{ color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.1)" }}
              aria-label="Next"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Counter */}
          {displayImages.length > 1 && (
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              {lightboxIndex + 1} / {displayImages.length}
            </span>
          )}
        </div>
      )}
    </>
  )
}
