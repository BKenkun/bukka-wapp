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
      <div className="w-full px-8 py-8 text-center" style={{ color: "var(--text-muted)" }}>
        <p className="text-sm">Configure the megamenu from the admin panel</p>
      </div>
    )
  }

  // Determine featured section title
  const featuredTitle = hasPerformers && hasProducts
    ? "Featured"
    : hasProducts
      ? "Products"
      : "Performers"

  // CASE 1: Only featured (no videos, no links) - slider de 3 con flechas si hay 4+
  if (hasFeatured && !hasVideos && !hasLinks) {
    return (
      <div className="w-full px-8 py-6">
        <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{featuredTitle}</h3>
        <FeaturedSlider items={featuredItems} />
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
          <nav className="space-y-1">{col1.map((link) => <MegamenuLinkItem key={link.id} link={link} />)}</nav>
          <nav className="space-y-1">{col2.map((link) => <MegamenuLinkItem key={link.id} link={link} />)}</nav>
          <nav className="space-y-1">{col3.map((link) => <MegamenuLinkItem key={link.id} link={link} />)}</nav>
          <nav className="space-y-1">{col4.map((link) => <MegamenuLinkItem key={link.id} link={link} />)}</nav>
        </div>
      </div>
    )
  }

  // CASE 3: Only videos
  if (hasVideos && !hasFeatured && !hasLinks) {
    return (
      <div className="w-full px-8 py-6">
        <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Featured Videos</h3>
        <VideoSlider videos={videos} />
      </div>
    )
  }

  // CASE 4: Featured + Links (no videos)
  if (hasFeatured && hasLinks && !hasVideos) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex gap-8">
          <div className="w-44 flex-shrink-0">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{linksSectionTitle}</h3>
            <nav className="space-y-1">
              {links.map((link) => <MegamenuLinkItem key={link.id} link={link} />)}
            </nav>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{featuredTitle}</h3>
            <FeaturedSlider items={featuredItems} />
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
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Featured Videos</h3>
            <VideoSlider videos={videos} />
          </div>
          <div className="w-[320px] flex-shrink-0">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{featuredTitle}</h3>
            <FeaturedSlider items={featuredItems} />
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
          <div className="w-44 flex-shrink-0">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{linksSectionTitle}</h3>
            <nav className="space-y-1">
              {links.map((link) => <MegamenuLinkItem key={link.id} link={link} />)}
            </nav>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Featured Videos</h3>
            <VideoSlider videos={videos} />
          </div>
        </div>
      </div>
    )
  }

  // CASE 7: All three - Links, Videos, Featured
  return (
    <div className="w-full px-8 py-6">
      <div className="flex gap-6">
        <div className="w-44 flex-shrink-0">
          <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{linksSectionTitle}</h3>
          <nav className="space-y-1">
            {links.map((link) => <MegamenuLinkItem key={link.id} link={link} />)}
          </nav>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Featured Videos</h3>
          <VideoSlider videos={videos} />
        </div>
        <div className="w-[240px] flex-shrink-0">
          <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{featuredTitle}</h3>
          <FeaturedSlider items={featuredItems} />
        </div>
      </div>
    </div>
  )
}

// Video slider: shows 3 at a time, arrows when there are 4+
function VideoSlider({ videos }: { videos: MegamenuData["videos"] }) {
  const [offset, setOffset] = useState(0)
  const visible = 3
  const canScroll = videos.length > visible
  const maxOffset = Math.max(0, videos.length - visible)

  return (
    <div className="relative">
      {canScroll && offset > 0 && (
        <button
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
          style={{ backgroundColor: "var(--brand-color)" }}
        >
          <svg className="w-3 h-3" style={{ color: "var(--text-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="grid grid-cols-3 gap-4">
        {videos.slice(offset, offset + visible).map((video) => (
          <MegamenuVideoCard key={video.id} video={video} />
        ))}
      </div>

      {canScroll && offset < maxOffset && (
        <button
          onClick={() => setOffset((o) => Math.min(maxOffset, o + 1))}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
          style={{ backgroundColor: "var(--brand-color)" }}
        >
          <svg className="w-3 h-3" style={{ color: "var(--text-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Featured slider: muestra 3 a la vez, flechas cuando hay 4+ (misma UX que VideoSlider)
function FeaturedSlider({ items }: { items: FeaturedItem[] }) {
  const [offset, setOffset] = useState(0)
  const visible = 3
  const canScroll = items.length > visible
  const maxOffset = Math.max(0, items.length - visible)
  const cols = Math.min(items.length, visible)

  return (
    <div className="relative">
      {canScroll && offset > 0 && (
        <button
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
          style={{ backgroundColor: "var(--brand-color)" }}
          aria-label="Anterior"
        >
          <svg className="w-3 h-3" style={{ color: "var(--text-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {items.slice(offset, offset + visible).map((item) =>
          item.type === "performer" ? (
            <MegamenuPerformerCard key={item.data.id} performer={item.data} />
          ) : (
            <MegamenuProductCard key={item.data.id} product={item.data} />
          )
        )}
      </div>

      {canScroll && offset < maxOffset && (
        <button
          onClick={() => setOffset((o) => Math.min(maxOffset, o + 1))}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
          style={{ backgroundColor: "var(--brand-color)" }}
          aria-label="Siguiente"
        >
          <svg className="w-3 h-3" style={{ color: "var(--text-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
