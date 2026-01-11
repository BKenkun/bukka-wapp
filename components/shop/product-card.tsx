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
    performer?: {
      name: string
      slug: string
    } | null
  }
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="relative group">
      {/* Product Card */}
      <div className="relative w-full aspect-[3/4] bg-[#1a1a1a]">
        {/* Product Label */}
        {product.performer && (
          <div
            className="absolute top-4 left-4 z-10 px-4 py-2 text-white text-center"
            style={{
              fontFamily: "Montserrat",
              fontSize: "11.113px",
              fontWeight: 400,
              lineHeight: "normal",
              background: "#3B82F6",
            }}
          >
            De {product.performer.name}
          </div>
        )}

        {/* Stock Badge */}
        {product.trackInventory && product.stock <= 3 && product.stock > 0 && (
          <div
            className="absolute top-4 right-4 z-10 px-3 py-1 text-white text-center"
            style={{
              fontFamily: "Montserrat",
              fontSize: "11px",
              fontWeight: 500,
              background: "#DC2626",
            }}
          >
            Solo {product.stock}!
          </div>
        )}

        {/* Product Image */}
        <Link href={`/tienda/${product.slug}`} className="absolute inset-0">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[70%] h-[60%] rounded-[40px] bg-gray-700" />
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

        {/* Rating - placeholder */}
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="15"
              viewBox="0 0 17 15"
              fill="none"
            >
              <path
                d="M9.17115 0.520916C9.01777 0.202578 8.69365 0 8.33769 0C7.98173 0 7.6605 0.202578 7.50422 0.520916L5.6434 4.34965L1.48765 4.96317C1.14037 5.01526 0.850973 5.25835 0.743896 5.59116C0.636819 5.92397 0.723638 6.2915 0.97252 6.53749L3.98804 9.52118L3.27612 13.7377C3.21824 14.085 3.36294 14.438 3.64945 14.6435C3.93595 14.849 4.31506 14.875 4.62761 14.7101L8.34058 12.7277L12.0536 14.7101C12.3661 14.875 12.7452 14.8519 13.0317 14.6435C13.3182 14.4352 13.4629 14.085 13.405 13.7377L12.6902 9.52118L15.7058 6.53749C15.9546 6.2915 16.0443 5.92397 15.8244 5.59116C15.7144 5.25835 15.4279 5.01526 15.0806 4.96317L11.032 4.34965L9.17115 0.520916Z"
                fill={i < 4 ? "#FACC15" : "#374151"}
              />
            </svg>
          ))}
        </div>

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

        {/* Add to Cart Button */}
        <AddToCartButton
          productId={product.id}
          stock={product.stock}
          trackInventory={product.trackInventory}
          className="w-full mt-auto"
        />
      </div>
    </div>
  )
}
