"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, X, Loader2, ShoppingBag, Play, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  slug: string
  name: string
  price: number
  compareAtPrice: number | null
  images: string[]
}

interface Video {
  id: string
  slug: string
  title: string
  thumbnailUrl: string
  duration: number
  viewCount: number
}

interface Performer {
  id: string
  slug: string
  name: string
  profileImage: string | null
  videoCount: number
}

interface SearchResults {
  products: Product[]
  videos: Video[]
  performers: Performer[]
}

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery("")
      setResults(null)
      setSelectedIndex(-1)
    }
  }, [open])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!results) return

      const allItems = [
        ...results.products.map((p) => ({ type: "product" as const, slug: p.slug })),
        ...results.videos.map((v) => ({ type: "video" as const, slug: v.slug })),
        ...results.performers.map((p) => ({ type: "performer" as const, slug: p.slug })),
      ]

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault()
        const item = allItems[selectedIndex]
        if (item) {
          const url =
            item.type === "product"
              ? `/tienda/${item.slug}`
              : item.type === "video"
                ? `/videos/${item.slug}`
                : `/modelos/${item.slug}`
          router.push(url)
          onOpenChange(false)
        }
      } else if (e.key === "Escape") {
        onOpenChange(false)
      }
    },
    [results, selectedIndex, router, onOpenChange]
  )

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onOpenChange(false)
      }
    },
    [onOpenChange]
  )

  if (!open) return null

  const hasResults =
    results && (results.products.length > 0 || results.videos.length > 0 || results.performers.length > 0)
  const noResults = results && !hasResults && query.length >= 2

  let currentIndex = -1

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[100] flex items-start justify-center pt-20 px-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl">
        {/* Search input */}
        <div className="relative flex w-full h-12 bg-zinc-900 border border-zinc-700 items-center px-4">
          <Search className="w-5 h-5 text-zinc-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar productos, videos, modelos..."
            className="bg-transparent border-none outline-none text-white placeholder-zinc-500 w-full font-['Montserrat'] text-base"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-[#FA4860] animate-spin shrink-0 mr-3" />}
          <button onClick={() => onOpenChange(false)} className="hover:opacity-80 transition-opacity text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Results */}
        {hasResults && (
          <div className="mt-2 bg-zinc-900 border border-zinc-700 divide-y divide-zinc-800 max-h-[60vh] overflow-y-auto">
            {/* Products */}
            {results.products.length > 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-4 h-4 text-[#FA4860]" />
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Productos</span>
                </div>
                <div className="space-y-2">
                  {results.products.map((product) => {
                    currentIndex++
                    const isSelected = selectedIndex === currentIndex
                    return (
                      <Link
                        key={product.id}
                        href={`/tienda/${product.slug}`}
                        onClick={() => onOpenChange(false)}
                        className={`flex items-center gap-3 p-2 rounded transition-colors ${
                          isSelected ? "bg-zinc-800" : "hover:bg-zinc-800"
                        }`}
                      >
                        <div className="relative w-12 h-12 shrink-0 bg-zinc-800 overflow-hidden">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{product.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[#FA4860] text-sm font-bold">{product.price.toFixed(2)} €</span>
                            {product.compareAtPrice && (
                              <span className="text-zinc-500 text-xs line-through">
                                {product.compareAtPrice.toFixed(2)} €
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Videos */}
            {results.videos.length > 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Play className="w-4 h-4 text-[#FA4860]" />
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Videos</span>
                </div>
                <div className="space-y-2">
                  {results.videos.map((video) => {
                    currentIndex++
                    const isSelected = selectedIndex === currentIndex
                    return (
                      <Link
                        key={video.id}
                        href={`/videos/${video.slug}`}
                        onClick={() => onOpenChange(false)}
                        className={`flex items-center gap-3 p-2 rounded transition-colors ${
                          isSelected ? "bg-zinc-800" : "hover:bg-zinc-800"
                        }`}
                      >
                        <div className="relative w-20 h-12 shrink-0 bg-zinc-800 overflow-hidden">
                          {video.thumbnailUrl ? (
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-5 h-5 text-zinc-600" />
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 bg-black/80 px-1 text-[10px] text-white font-medium">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{video.title}</p>
                          <p className="text-zinc-500 text-xs">
                            {video.viewCount.toLocaleString()} visualizaciones
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Performers */}
            {results.performers.length > 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-[#FA4860]" />
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Modelos</span>
                </div>
                <div className="space-y-2">
                  {results.performers.map((performer) => {
                    currentIndex++
                    const isSelected = selectedIndex === currentIndex
                    return (
                      <Link
                        key={performer.id}
                        href={`/modelos/${performer.slug}`}
                        onClick={() => onOpenChange(false)}
                        className={`flex items-center gap-3 p-2 rounded transition-colors ${
                          isSelected ? "bg-zinc-800" : "hover:bg-zinc-800"
                        }`}
                      >
                        <div className="relative w-12 h-12 shrink-0 bg-zinc-800 rounded-full overflow-hidden">
                          {performer.profileImage ? (
                            <Image
                              src={performer.profileImage}
                              alt={performer.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-5 h-5 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{performer.name}</p>
                          <p className="text-zinc-500 text-xs">
                            {performer.videoCount} {performer.videoCount === 1 ? "video" : "videos"}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No results */}
        {noResults && (
          <div className="mt-2 bg-zinc-900 border border-zinc-700 p-8 text-center">
            <Search className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-white font-medium">No se encontraron resultados</p>
            <p className="text-zinc-500 text-sm mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        )}

        {/* Initial state */}
        {!results && query.length < 2 && (
          <div className="mt-2 bg-zinc-900 border border-zinc-700 p-6 text-center">
            <p className="text-zinc-400 text-sm">Escribe al menos 2 caracteres para buscar</p>
          </div>
        )}
      </div>
    </div>
  )
}
