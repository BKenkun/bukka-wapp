"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"

interface StickyHeaderProps {
  children: React.ReactNode
  topBar: React.ReactNode
  searchBar?: React.ReactNode
  discountBanner?: React.ReactNode
}

export function StickyHeader({ children, topBar, searchBar, discountBanner }: StickyHeaderProps) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [scrolled, setScrolled] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(0)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

  const showBackground = !isHome || scrolled
  const showTopBar = !isHome || scrolled
  const showSearchBar = !isHome || scrolled
  const showDiscountBanner = !isHome && !scrolled

  return (
    <>
      <div
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          showBackground ? "bg-black" : "bg-transparent"
        }`}
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
              showDiscountBanner ? "max-h-[80px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {discountBanner}
          </div>
        )}
      </div>
      {/* Spacer to push content below fixed header */}
      {!isHome && <div style={{ height: headerHeight }} />}
    </>
  )
}
