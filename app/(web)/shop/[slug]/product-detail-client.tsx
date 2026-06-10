"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, Plus, Minus, Package, Shield, Lock, RotateCcw, Truck, ShieldCheck, Heart, Star, Award, CheckCircle, Clock, Gift, CreditCard, Eye, EyeOff, Headphones, ThumbsUp, Zap, Share2 } from "lucide-react"
import { toast } from "sonner"
import { VariantSelector } from "@/components/shop/variant-selector"
import { StarRating } from "@/components/shop/star-rating"
import type { ShopSettingsTrustBadge, ShopSettingsCareInstruction, SectionStyles } from "@/lib/get-shop-settings"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Package, Shield, Lock, RotateCcw, Truck, ShieldCheck,
  Heart, Star, Award, CheckCircle, Clock, Gift,
  CreditCard, Eye, EyeOff, Headphones, ThumbsUp, Zap,
}

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
  trustBadges?: ShopSettingsTrustBadge[]
  trustBadgesStyles?: SectionStyles
  careInstructions?: ShopSettingsCareInstruction[]
}

export function ProductDetailClient({
  product,
  attributes,
  trustBadges = [],
  trustBadgesStyles,
}: ProductDetailClientProps) {

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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        url: window.location.href,
      })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied")
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Left Side - Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div
            className="relative w-full aspect-square overflow-hidden cursor-zoom-in"
            style={{ backgroundColor: "var(--surface-bg, #f3f4f6)" }}
            onClick={() => openLightbox(currentImageIndex)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={displayImages[currentImageIndex]}
              alt={`${product.name} - Image ${currentImageIndex + 1}`}
              fill
              className="object-contain p-6"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />

            {/* Discount Badge */}
            {hasDiscount && discountPercent > 0 && (
              <span
                className="absolute top-4 left-4 z-10 text-xs font-bold px-3 py-1.5 text-white"
                style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
              >
                -{discountPercent}% OFF
              </span>
            )}

            {/* Share Button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleShare() }}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center transition-colors border"
              style={{
                backgroundColor: "rgba(255,255,255,0.9)",
                borderColor: "var(--border-color, #e5e7eb)",
                color: "var(--text-primary, #000)",
              }}
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Navigation Arrows */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage() }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 transition-all hover:scale-110"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage() }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 transition-all hover:scale-110"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
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
                    outline: index === currentImageIndex
                      ? "3px solid var(--brand-color, #E03E54)"
                      : "2px solid var(--border-color, #e5e7eb)",
                    outlineOffset: "2px",
                    opacity: index === currentImageIndex ? 1 : 0.6,
                    backgroundColor: "var(--surface-bg, #f3f4f6)",
                  }}
                >
                  <Image
                    src={img}
                    alt={`${product.name} - Thumbnail ${index + 1}`}
                    fill
                    className="object-contain p-2 hover:opacity-100 transition-opacity"
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
            className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
            style={{
              color: "var(--text-primary, #000)",
              fontFamily: "var(--global-font)",
            }}
          >
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mt-4">
            <StarRating rating={5} size={16} />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-muted, #6b7280)" }}
            >
              (5.0)
            </span>
          </div>

          {/* SKU */}
          {currentSku && (
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--text-muted, #6b7280)", fontFamily: "var(--global-font)" }}
            >
              SKU: {currentSku}
            </p>
          )}

          {/* Price */}
          <div className="mt-5 flex items-baseline gap-3 flex-wrap">
            <span
              className="text-4xl md:text-5xl font-bold"
              style={{
                color: "var(--brand-color, #E03E54)",
                fontFamily: "var(--global-font)",
              }}
            >
              {currentPrice.toFixed(2)}€
            </span>
            {hasDiscount && (
              <>
                <span
                  className="line-through text-xl"
                  style={{ color: "var(--text-muted, #9ca3af)" }}
                >
                  {currentCompareAtPrice?.toFixed(2)}€
                </span>
                <span
                  className="text-sm font-bold px-3 py-1.5"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--brand-color, #E03E54) 10%, transparent)",
                    color: "var(--brand-color, #E03E54)",
                  }}
                >
                  SAVE {discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          {product.trackInventory && (
            <div
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: currentStock > 0
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                color: currentStock > 0 ? "#10B981" : "#EF4444",
              }}
            >
              {currentStock > 0 && (
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "#10B981" }}
                />
              )}
              {currentStock > 0
                ? currentStock <= 5
                  ? `In stock — Only ${currentStock} left!`
                  : "In stock"
                : "Sold Out"}
            </div>
          )}

          {/* Separator */}
          <div
            className="my-6"
            style={{ height: "1px", backgroundColor: "var(--border-color, #e5e7eb)" }}
          />

          {/* Short Description */}
          {product.description && (
            <div
              className="mb-6 line-clamp-3"
              style={{
                color: "var(--text-muted, #6b7280)",
                fontFamily: "var(--global-font)",
                fontSize: "15px",
                lineHeight: "1.7",
              }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {/* Variant Selector */}
          {isVariable && attributes.length > 0 && (
            <div className="mb-6">
              <VariantSelector
                productSlug={product.slug}
                attributes={attributes}
                basePrice={product.price}
                onVariantChange={handleVariantChange}
              />
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="space-y-4 mb-6">
            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary, #000)" }}
              >
                Quantity
              </span>
              <div
                className="flex items-center overflow-hidden"
                style={{ border: `1px solid var(--border-color, #e5e7eb)` }}
              >
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-14 h-14 flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ color: "var(--text-primary, #000)" }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "var(--brand-color, #E03E54)"
                      e.currentTarget.style.color = "#fff"
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                    e.currentTarget.style.color = "var(--text-primary, #000)"
                  }}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  className="w-14 h-14 flex items-center justify-center text-center font-bold text-lg"
                  style={{
                    color: "var(--text-primary, #000)",
                    fontFamily: "var(--global-font)",
                    borderLeft: `1px solid var(--border-color, #e5e7eb)`,
                    borderRight: `1px solid var(--border-color, #e5e7eb)`,
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={quantity >= maxQuantity}
                  className="w-14 h-14 flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ color: "var(--text-primary, #000)" }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "var(--brand-color, #E03E54)"
                      e.currentTarget.style.color = "#fff"
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                    e.currentTarget.style.color = "var(--text-primary, #000)"
                  }}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={loading || isOutOfStock}
                className="w-full py-5 text-lg font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isOutOfStock
                    ? "var(--text-muted, #9ca3af)"
                    : "var(--brand-color, #E03E54)",
                }}
              >
                {loading
                  ? "Adding..."
                  : isOutOfStock
                    ? isVariable && !selectedVariant
                      ? "Select Options"
                      : "Sold Out"
                    : `Add to Cart — ${(currentPrice * quantity).toFixed(2)}€`}
              </button>

              {/* Buy Now */}
              {!isOutOfStock && (
                <button
                  onClick={handleAddToCart}
                  className="w-full py-5 text-lg font-bold transition-all hover:opacity-90 border-2"
                  style={{
                    color: "var(--text-primary, #000)",
                    borderColor: "var(--text-primary, #000)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--text-primary, #000)"
                    e.currentTarget.style.color = "#fff"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                    e.currentTarget.style.color = "var(--text-primary, #000)"
                  }}
                >
                  Buy Now
                </button>
              )}
            </div>
          </div>

          {/* Trust Badges */}
          {trustBadges.length > 0 && (
            <div
              className="grid gap-4 pt-6"
              style={{
                gridTemplateColumns: `repeat(${Math.min(trustBadges.length, 4)}, 1fr)`,
                borderTop: `1px solid var(--border-color, #e5e7eb)`,
              }}
            >
              {trustBadges.map((badge, index) => {
                const IconComponent = ICON_MAP[badge.icon] || Shield
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2 text-center p-4"
                    style={{ backgroundColor: trustBadgesStyles?.bgColor || "var(--surface-bg, #f9fafb)" }}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center"
                      style={{
                        backgroundColor: trustBadgesStyles?.iconBgColor
                          || "color-mix(in srgb, var(--brand-color, #E03E54) 10%, transparent)",
                      }}
                    >
                      <IconComponent
                        className="w-5 h-5"
                        style={{ color: trustBadgesStyles?.iconColor || "var(--brand-color, #E03E54)" }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium leading-tight"
                      style={{ color: "var(--text-muted, #6b7280)", fontFamily: "var(--global-font)" }}
                    >
                      {badge.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-3 transition-colors z-10"
            style={{ color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.1)" }}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {displayImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 transition-colors z-10"
              style={{ color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.1)" }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

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

          {displayImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % displayImages.length) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 transition-colors z-10"
              style={{ color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.1)" }}
              aria-label="Next"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

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
