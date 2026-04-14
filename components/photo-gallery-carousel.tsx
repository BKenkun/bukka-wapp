"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import Image from "next/image"

interface Photo {
  id?: string
  imageUrl: string
  caption?: string | null
}

interface PhotoGalleryCarouselProps {
  photos: Photo[]
  performerName: string
}

export function PhotoGalleryCarousel({ photos, performerName }: PhotoGalleryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const hasDragged = useRef(false)
  const dragStartX = useRef(0)
  const dragScrollLeft = useRef(0)
  const isResetting = useRef(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // 3x items for infinite loop
  const items = photos.length > 0 ? photos : []
  const tripled = [...items, ...items, ...items]

  const getSetWidth = useCallback(() => {
    const el = scrollRef.current
    if (!el || items.length === 0) return 0
    return el.scrollWidth / 3
  }, [items.length])

  // Initialize scroll to the middle set
  useEffect(() => {
    const el = scrollRef.current
    if (!el || items.length === 0) return
    requestAnimationFrame(() => {
      const setWidth = el.scrollWidth / 3
      el.scrollLeft = setWidth
    })
  }, [items.length])

  // Loop on scroll
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
    return () => el.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.75
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" })
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

  const handleDragEnd = () => setIsDragging(false)

  const handleClick = (realIndex: number) => {
    if (hasDragged.current) return
    setLightboxIndex(realIndex)
  }

  // Lightbox navigation
  const lightboxPrev = () => setLightboxIndex((prev) => prev !== null ? (prev - 1 + items.length) % items.length : null)
  const lightboxNext = () => setLightboxIndex((prev) => prev !== null ? (prev + 1) % items.length : null)

  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowLeft") lightboxPrev()
      if (e.key === "ArrowRight") lightboxNext()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKey)
    return () => { window.removeEventListener("keydown", handleKey); document.body.style.overflow = "" }
  }, [lightboxIndex])

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
    <>
      <section className="w-full relative group/carousel">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer hover:scale-110"
          style={arrowStyle}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--carousel-arrow-hover-bg, #000000)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--carousel-arrow-bg, #1A1A1A)" }}
          aria-label="Previous"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer hover:scale-110"
          style={arrowStyle}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--carousel-arrow-hover-bg, #000000)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--carousel-arrow-bg, #1A1A1A)" }}
          aria-label="Next"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Scrollable container - 3x for infinite loop */}
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
        >
          {tripled.map((photo, index) => {
            const realIndex = index % items.length
            return (
              <div
                key={`${photo.id || realIndex}-${Math.floor(index / items.length)}`}
                className="flex-shrink-0 w-[60vw] sm:w-[42vw] md:w-[32vw] lg:w-[25vw] xl:w-[20vw] 2xl:w-[17vw]"
                onClick={() => handleClick(realIndex)}
              >
                <div className="relative w-full aspect-[9/16] overflow-hidden group cursor-pointer">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.caption || `${performerName} photo ${realIndex + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 60vw, (max-width: 1200px) 32vw, 20vw"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <div className="absolute inset-0 bg-black/90" />

          {/* Close */}
          <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 z-10 p-2 cursor-pointer hover:opacity-70" style={{ color: "#fff" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Prev */}
          <button onClick={(e) => { e.stopPropagation(); lightboxPrev() }} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 cursor-pointer hover:scale-110 transition-transform" style={{ ...arrowStyle }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next */}
          <button onClick={(e) => { e.stopPropagation(); lightboxNext() }} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 cursor-pointer hover:scale-110 transition-transform" style={{ ...arrowStyle }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Image */}
          <div className="relative max-w-[90vw] max-h-[90vh] w-auto h-auto" onClick={(e) => e.stopPropagation()}>
            <Image
              src={items[lightboxIndex].imageUrl}
              alt={items[lightboxIndex].caption || `${performerName} photo ${lightboxIndex + 1}`}
              width={800}
              height={1200}
              className="object-contain max-h-[90vh] w-auto"
              priority
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-montserrat">
            {lightboxIndex + 1} / {items.length}
          </div>
        </div>
      )}
    </>
  )
}
