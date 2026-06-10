"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { VideoCard } from "./video-card"

interface Performer {
  name: string
  slug: string
}

interface Video {
  id: string
  slug?: string
  title: string
  subtitle?: string
  views: string
  likes?: string
  imageUrl: string
  previewUrl?: string
  previewStartTime?: number
  previewEndTime?: number
  isVerified?: boolean
  category?: string
  performers?: Performer[]
  publishedAt?: Date | string
}

interface VideoCarouselProps {
  videos?: Video[]
  variant?: "overlay" | "below"
}

export function VideoCarousel({ videos = [], variant = "overlay" }: VideoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const hasDragged = useRef(false)
  const dragStartX = useRef(0)
  const dragScrollLeft = useRef(0)
  const isResetting = useRef(false)

  const items = videos.length > 0 ? videos : []
  const tripled = [...items, ...items, ...items]

  const getSetWidth = useCallback(() => {
    const el = scrollRef.current
    if (!el || items.length === 0) return 0
    return el.scrollWidth / 3
  }, [items.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || items.length === 0) return
    requestAnimationFrame(() => {
      const setWidth = el.scrollWidth / 3
      el.scrollLeft = setWidth
    })
  }, [items.length])

  const handleScroll = useCallback(() => {
    if (isResetting.current) return
    const el = scrollRef.current
    if (!el || items.length === 0) return

    const setWidth = getSetWidth()
    if (setWidth === 0) return

    if (el.scrollLeft >= setWidth * 2) {
      isResetting.current = true
      el.style.scrollBehavior = "auto"
      el.scrollLeft = el.scrollLeft - setWidth
      el.style.scrollBehavior = ""
      isResetting.current = false
    } else if (el.scrollLeft <= 0) {
      isResetting.current = true
      el.style.scrollBehavior = "auto"
      el.scrollLeft = el.scrollLeft + setWidth
      el.style.scrollBehavior = ""
      isResetting.current = false
    }
  }, [getSetWidth, items.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.75
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  const handleDragStart = (clientX: number) => {
    const el = scrollRef.current
    if (!el) return
    setIsDragging(true)
    hasDragged.current = false
    dragStartX.current = clientX
    dragScrollLeft.current = el.scrollLeft
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return
    const el = scrollRef.current
    if (!el) return
    const dx = clientX - dragStartX.current
    if (Math.abs(dx) > 5) hasDragged.current = true
    el.scrollLeft = dragScrollLeft.current - dx
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const arrowStyle: React.CSSProperties = {
    width: "var(--carousel-arrow-size, 44px)",
    height: "var(--carousel-arrow-size, 44px)",
    backgroundColor: "var(--carousel-arrow-bg, #1A1A1A)",
    borderColor: "var(--carousel-arrow-border, #FA4860)",
    borderWidth: "var(--carousel-arrow-border-width, 2px)",
    borderStyle: "solid",
    borderRadius: "var(--carousel-arrow-radius, 50%)",
    color: "var(--carousel-arrow-icon, #FFFFFF)",
  }

  if (items.length === 0) return null

  return (
    <section className="w-full relative group/carousel">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer hover:scale-110"
        style={arrowStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--carousel-arrow-hover-bg, #000000)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--carousel-arrow-bg, #1A1A1A)"
        }}
        aria-label="Previous"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer hover:scale-110"
        style={arrowStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--carousel-arrow-hover-bg, #000000)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--carousel-arrow-bg, #1A1A1A)"
        }}
        aria-label="Next"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Scrollable container - 3x items for infinite loop */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto select-none"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: isDragging ? "grabbing" : "grab",
          WebkitOverflowScrolling: "touch",
        }}
        onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX) }}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
        onClickCapture={handleClick}
      >
        {tripled.map((video, index) => (
          <div
            key={`${video.id}-${Math.floor(index / items.length)}`}
            className="flex-shrink-0 w-[80vw] sm:w-[45vw] md:w-[35vw] lg:w-[28vw] xl:w-[22vw]"
          >
            <VideoCard
              videoId={video.id}
              slug={video.slug || video.id}
              title={video.title}
              subtitle={video.subtitle}
              views={video.views}
              likes={video.likes}
              imageUrl={video.imageUrl}
              previewUrl={video.previewUrl}
              previewStartTime={video.previewStartTime}
              previewEndTime={video.previewEndTime}
              isVerified={video.isVerified}
              variant={variant}
              category={video.category}
              performers={video.performers}
              publishedAt={video.publishedAt}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
