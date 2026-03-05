"use client"

import { useState } from "react"
import type { MegamenuData, MegamenuPerformer, MegamenuProduct } from "@/types/megamenu"
import { MegamenuPerformerCard } from "./megamenu-performer-card"
import { MegamenuProductCard } from "./megamenu-product-card"
import { MegamenuVideoCard } from "./megamenu-video-card"
import { MegamenuLinkItem } from "./megamenu-link-item"

type FeaturedItem =
  | { type: "performer"; data: MegamenuPerformer }
  | { type: "product"; data: MegamenuProduct }

interface MegamenuProps {
  data: MegamenuData
}

export function Megamenu({ data }: MegamenuProps) {
  const { performers, products, videos, links, linksSectionTitle } = data
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)

  const hasPerformers = performers.length > 0
  const hasProducts = (products ?? []).length > 0
  const hasFeatured = hasPerformers || hasProducts
  const hasVideos = videos.length > 0
  const hasLinks = links.length > 0

  // Build combined featured items list (performers first, then products)
  const featuredItems: FeaturedItem[] = [
    ...performers.map((p): FeaturedItem => ({ type: "performer", data: p })),
    ...(products ?? []).map((p): FeaturedItem => ({ type: "product", data: p })),
  ]

  if (!hasFeatured && !hasVideos && !hasLinks) {
    return (
      <div className="w-full px-8 py-8 text-center text-zinc-500">
        <p className="text-sm">Configura el megamenu desde el panel de administración</p>
      </div>
    )
  }

  const nextFeatured = () => {
    setCurrentFeaturedIndex((prev) => (prev + 1) % featuredItems.length)
  }

  const prevFeatured = () => {
    setCurrentFeaturedIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length)
  }

  // Determine featured section title
  const featuredTitle = hasPerformers && hasProducts
    ? "Destacados"
    : hasProducts
      ? "Productos"
      : "Modelos"

  // CASE 1: Only featured (no videos, no links) - show in grid
  if (hasFeatured && !hasVideos && !hasLinks) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{featuredTitle}</h3>
        </div>
        <div className="grid grid-cols-4 gap-4 max-w-3xl">
          {featuredItems.map((item) =>
            item.type === "performer" ? (
              <MegamenuPerformerCard key={item.data.id} performer={item.data} />
            ) : (
              <MegamenuProductCard key={item.data.id} product={item.data} />
            )
          )}
        </div>
      </div>
    )
  }

  // CASE 2: Only links (no videos, no featured) - 4 balanced columns
  if (hasLinks && !hasVideos && !hasFeatured) {
    const totalLinks = links.length
    const basePerColumn = Math.floor(totalLinks / 4)
    const remainder = totalLinks % 4

    const col1Count = basePerColumn + (remainder >= 1 ? 1 : 0)
    const col2Count = basePerColumn + (remainder >= 2 ? 1 : 0)
    const col3Count = basePerColumn + (remainder >= 3 ? 1 : 0)

    const col1 = links.slice(0, col1Count)
    const col2 = links.slice(col1Count, col1Count + col2Count)
    const col3 = links.slice(col1Count + col2Count, col1Count + col2Count + col3Count)
    const col4 = links.slice(col1Count + col2Count + col3Count)

    return (
      <div className="w-full px-8 py-6">
        {linksSectionTitle && (
          <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{linksSectionTitle}</h3>
        )}
        <div className="grid grid-cols-4 gap-8">
          <nav className="space-y-1">
            {col1.map((link) => (
              <MegamenuLinkItem key={link.id} link={link} />
            ))}
          </nav>
          <nav className="space-y-1">
            {col2.map((link) => (
              <MegamenuLinkItem key={link.id} link={link} />
            ))}
          </nav>
          <nav className="space-y-1">
            {col3.map((link) => (
              <MegamenuLinkItem key={link.id} link={link} />
            ))}
          </nav>
          <nav className="space-y-1">
            {col4.map((link) => (
              <MegamenuLinkItem key={link.id} link={link} />
            ))}
          </nav>
        </div>
      </div>
    )
  }

  // CASE 3: Only videos
  if (hasVideos && !hasFeatured && !hasLinks) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Vídeos destacados</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {videos.slice(0, 3).map((video) => (
            <MegamenuVideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    )
  }

  // CASE 4: Featured + Links (no videos) - links first, then featured in grid
  if (hasFeatured && hasLinks && !hasVideos) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex gap-8">
          {/* Links section */}
          <div className="w-44 flex-shrink-0">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{linksSectionTitle}</h3>
            <nav className="space-y-1">
              {links.map((link) => (
                <MegamenuLinkItem key={link.id} link={link} />
              ))}
            </nav>
          </div>

          {/* Featured items grid */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{featuredTitle}</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {featuredItems.map((item) =>
                item.type === "performer" ? (
                  <MegamenuPerformerCard key={item.data.id} performer={item.data} />
                ) : (
                  <MegamenuProductCard key={item.data.id} product={item.data} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // CASE 5: Featured + Videos (no links)
  if (hasFeatured && hasVideos && !hasLinks) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex gap-8">
          {/* Videos section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Vídeos destacados</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {videos.slice(0, 3).map((video) => (
                <MegamenuVideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>

          {/* Featured carousel */}
          <div className="w-48 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{featuredTitle}</h3>
            </div>
            <FeaturedCarousel
              items={featuredItems}
              currentIndex={currentFeaturedIndex}
              onNext={nextFeatured}
              onPrev={prevFeatured}
              onDotClick={setCurrentFeaturedIndex}
            />
          </div>
        </div>
      </div>
    )
  }

  // CASE 6: Links + Videos (no featured)
  if (hasLinks && hasVideos && !hasFeatured) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex gap-8">
          {/* Links section */}
          <div className="w-44 flex-shrink-0">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{linksSectionTitle}</h3>
            <nav className="space-y-1">
              {links.map((link) => (
                <MegamenuLinkItem key={link.id} link={link} />
              ))}
            </nav>
          </div>

          {/* Videos section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Vídeos destacados</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {videos.slice(0, 3).map((video) => (
                <MegamenuVideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // CASE 7: All three - Links, Videos, Featured (carousel)
  return (
    <div className="w-full px-8 py-6">
      <div className="flex gap-6">
        {/* Links section */}
        <div className="w-44 flex-shrink-0">
          <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{linksSectionTitle}</h3>
          <nav className="space-y-1">
            {links.map((link) => (
              <MegamenuLinkItem key={link.id} link={link} />
            ))}
          </nav>
        </div>

        {/* Videos section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Vídeos destacados</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {videos.slice(0, 3).map((video) => (
              <MegamenuVideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>

        {/* Featured carousel */}
        <div className="w-48 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{featuredTitle}</h3>
          </div>
          <FeaturedCarousel
            items={featuredItems}
            currentIndex={currentFeaturedIndex}
            onNext={nextFeatured}
            onPrev={prevFeatured}
            onDotClick={setCurrentFeaturedIndex}
          />
        </div>
      </div>
    </div>
  )
}

// Generic carousel that renders both performer and product cards
function FeaturedCarousel({
  items,
  currentIndex,
  onNext,
  onPrev,
  onDotClick,
}: {
  items: FeaturedItem[]
  currentIndex: number
  onNext: () => void
  onPrev: () => void
  onDotClick: (index: number) => void
}) {
  const current = items[currentIndex]

  return (
    <div className="relative">
      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors cursor-pointer"
          >
            <svg className="w-3 h-3" style={{ color: "var(--text-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onNext}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors cursor-pointer"
          >
            <svg className="w-3 h-3" style={{ color: "var(--text-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Card */}
      <div className="overflow-hidden">
        {current.type === "performer" ? (
          <MegamenuPerformerCard performer={current.data} />
        ) : (
          <MegamenuProductCard product={current.data} />
        )}
      </div>

      {/* Dots indicator */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => onDotClick(index)}
              className="w-1.5 h-1.5 rounded-full transition-colors cursor-pointer"
              style={{ backgroundColor: index === currentIndex ? 'var(--brand-color)' : 'var(--text-muted)' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
