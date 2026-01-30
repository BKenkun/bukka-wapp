"use client"

import Image from "next/image"
import Link from "next/link"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"

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
  }
}

export function ProductCard({ product }: ProductCardProps) {
  // Calculate discount percentage
  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)
    : 0

  return (
    <div className="relative group">
      {/* Product Card */}
      <div className="relative w-full aspect-square bg-white overflow-hidden">
        {/* Discount Badge */}
        {hasDiscount && discountPercent > 0 && (
          <div
            className="absolute top-4 right-4 z-10 px-3 py-1 text-white text-center"
            style={{
              fontFamily: "Montserrat",
              fontSize: "12px",
              fontWeight: 600,
              background: "#FA4860",
            }}
          >
            -{discountPercent}%
          </div>
        )}

        {/* Product Image */}
        <Link href={`/tienda/${product.slug}`} className="absolute inset-0 p-4">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[70%] h-[60%] rounded-[40px] bg-gray-300" />
            </div>
          )}
        </Link>
      </div>

      {/* Product Info */}
      <div className="mt-4 bg-black flex flex-col">
        {/* Product Title */}
        <Link href={`/tienda/${product.slug}`}>
          <h3
            className="text-white mb-2 hover:opacity-80 transition-opacity line-clamp-1"
            style={{
              fontFamily: "Montserrat",
              fontSize: "19.756px",
              fontWeight: 400,
              lineHeight: "29.634px",
            }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mb-4">
          <span
            className="text-white"
            style={{
              fontFamily: "Montserrat",
              fontSize: "22.226px",
              fontWeight: 700,
              lineHeight: "34.573px",
            }}
          >
            {Number(product.price).toFixed(2)}€
          </span>
          {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
            <span
              className="text-white line-through opacity-60"
              style={{
                fontFamily: "Montserrat",
                fontSize: "17.287px",
                fontWeight: 400,
                lineHeight: "24.695px",
              }}
            >
              {Number(product.compareAtPrice).toFixed(2)}€
            </span>
          )}
        </div>

        {/* Add to Cart Button or Select Variants */}
        {product.productType === "VARIABLE" ? (
          <Link
            href={`/tienda/${product.slug}`}
            className="w-full mt-auto text-white text-center block"
            style={{
              fontFamily: "Montserrat",
              fontSize: "19.756px",
              fontWeight: 400,
              lineHeight: "normal",
              background: "#FA4860",
              border: "0 solid #E5E7EB",
              padding: "12px 24px",
            }}
          >
            Seleccionar variantes
          </Link>
        ) : (
          <AddToCartButton
            productId={product.id}
            stock={product.stock}
            trackInventory={product.trackInventory}
            className="w-full mt-auto"
          />
        )}
      </div>
    </div>
  )
}
