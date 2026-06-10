"use client"

import Link from "next/link"
import type { MegamenuProduct } from "@/types/megamenu"

interface MegamenuProductCardProps {
  product: MegamenuProduct
}

export function MegamenuProductCard({ product }: MegamenuProductCardProps) {
  return (
    <Link
      href={`/tienda/${product.slug}`}
      className="group block cursor-pointer"
    >
      {/* Vertical image container - same as performer card */}
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-800">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        )}

        {/* Default gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Hover overlay with "VER" */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white font-montserrat font-bold text-xl tracking-wider">VIEW</span>
        </div>

        {/* Name and price at bottom */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <span className="text-white text-sm font-medium group-hover:text-white transition-colors line-clamp-1">
            {product.name}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-bold" style={{ color: "var(--brand-color)" }}>{product.price.toFixed(2)} &euro;</span>
            {product.compareAtPrice && (
              <span className="text-xs line-through" style={{ color: "var(--text-muted)" }}>
                {product.compareAtPrice.toFixed(2)} &euro;
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
