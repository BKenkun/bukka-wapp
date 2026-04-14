"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { StarRating } from "@/components/shop/star-rating"

interface ProductCardProps {
  product: {
    id: string
    slug: string
    name: string
    price: number
    compareAtPrice: number | null
    images: string[]
    stock: number
    trackInventory: boolean
    productType?: "SIMPLE" | "VARIABLE"
    performers?: {
      name: string
      slug: string
    }[]
    createdAt?: string | Date
  }
}

type BadgeType = "Sale" | "New" | null

function getBadge(product: ProductCardProps["product"]): BadgeType {
  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
  if (hasDiscount) return "Sale"

  if (product.createdAt) {
    const created = new Date(product.createdAt)
    const daysSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreation < 14) return "New"
  }

  return null
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)
    : 0

  const badge = getBadge(product)

  return (
    <div className="group">
      {/* Image Container */}
      <div className="relative overflow-hidden mb-4" style={{ backgroundColor: "var(--surface-bg, #f3f4f6)" }}>
        {/* Badge */}
        {badge && (
          <div
            className="absolute top-3 left-3 z-10 text-xs font-bold px-3 py-1.5 text-white"
            style={{
              backgroundColor: badge === "Sale"
                ? "var(--brand-color, #E03E54)"
                : "#000",
              border: badge === "New" ? "1px solid rgba(255,255,255,0.3)" : "none",
            }}
          >
            {badge === "Sale" ? `-${discountPercent}%` : "Nuevo"}
          </div>
        )}

        {/* Product Image */}
        <Link href={`/shop/${product.slug}`} className="block aspect-[4/5] relative">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[60%] h-[50%] bg-gray-300/50" />
            </div>
          )}
        </Link>
      </div>

      {/* Product Info */}
      <div className="px-1">
        {/* Name */}
        <Link href={`/tienda/${product.slug}`}>
          <h3
            className="font-bold mb-1 line-clamp-1 transition-colors"
            style={{
              color: "var(--text-primary, #000)",
              fontFamily: "var(--global-font)",
            }}
          >
            <span className="hover:opacity-70 transition-opacity">
              {product.name}
            </span>
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={5} size={14} />
          <span
            className="text-xs"
            style={{ color: "var(--text-muted, #6b7280)" }}
          >
            (5.0)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="font-bold text-xl"
            style={{
              color: "var(--text-primary, #000)",
              fontFamily: "var(--global-font)",
            }}
          >
            {Number(product.price).toFixed(2)}€
          </span>
          {hasDiscount && (
            <>
              <span
                className="line-through text-sm"
                style={{ color: "var(--text-muted, #9ca3af)" }}
              >
                {Number(product.compareAtPrice).toFixed(2)}€
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: "var(--brand-color, #E03E54)" }}
              >
                -{discountPercent}%
              </span>
            </>
          )}
        </div>

        {/* Add to Cart / Select Variants */}
        {product.productType === "VARIABLE" ? (
          <Link
            href={`/tienda/${product.slug}`}
            className="w-full flex items-center justify-center gap-2 py-3 font-bold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
          >
            <ShoppingCart className="w-4 h-4" />
            Seleccionar variantes
          </Link>
        ) : (
          <AddToCartButton
            productId={product.id}
            stock={product.stock}
            trackInventory={product.trackInventory}
            className="w-full"
          />
        )}
      </div>
    </div>
  )
}
