"use client"

import { useEffect, useState, useRef } from "react"

interface StickyHeaderProps {
  children: React.ReactNode
  topBar: React.ReactNode
  searchBar?: React.ReactNode
  discountBanner?: React.ReactNode
}

export function StickyHeader({ children, topBar, searchBar, discountBanner }: StickyHeaderProps) {
  const [headerHeight, setHeaderHeight] = useState(0)
  const headerRef = useRef<HTMLDivElement>(null)

  // Update header height using ResizeObserver for accurate measurements
  useEffect(() => {
    if (!headerRef.current) return

    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }

    // Initial update
    updateHeight()

    // Use ResizeObserver to detect size changes (e.g., when banner loads)
    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(headerRef.current)

    window.addEventListener("resize", updateHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateHeight)
    }
  }, [])

  // Barra de navegación siempre con color sólido y contenido (hero) debajo,
  // sin superponerse — petición del cliente (antes era transparente en la home).
  const showBackground = true
  const showTopBar = true
  const showSearchBar = false // Search is now an icon in header actions
  const showDiscountBanner = true

  return (
    <>
      <div
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ backgroundColor: showBackground ? "var(--global-bg)" : "transparent" }}
      >
        {/* Top Bar */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            showTopBar ? "max-h-[36px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {topBar}
        </div>

        {/* Search Bar - between TopBar and MainHeader */}
        {searchBar && (
          <div
            className={`transition-all duration-300 overflow-hidden ${
              showSearchBar ? "max-h-[60px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {searchBar}
          </div>
        )}

        {/* Main Header (children) */}
        {children}

        {/* Discount Banner */}
        {discountBanner && (
          <div
            className={`transition-all duration-300 overflow-hidden ${
              showDiscountBanner ? "max-h-[160px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {discountBanner}
          </div>
        )}
      </div>
      {/* Spacer to push content below fixed header (también en la home: el hero va debajo) */}
      <div style={{ height: headerHeight }} />
    </>
  )
}
