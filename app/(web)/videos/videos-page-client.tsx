"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUpDown } from "lucide-react"
import { VideoCard } from "@/components/video-card"
import { VideoFiltersSidebar } from "@/components/video-filters-sidebar"

interface VideoPerformer {
  name: string
  slug: string
}

interface Video {
  id: string
  slug: string
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
  performers?: VideoPerformer[]
  publishedAt?: Date | string
}

interface Category {
  id: string
  slug: string
  name: string
}

interface Performer {
  id: string
  slug: string
  name: string
}

interface Tag {
  id: string
  slug: string
  name: string
}

interface VideosPageClientProps {
  videos: Video[]
  categories: Category[]
  performers: Performer[]
  tags: Tag[]
  totalCount: number
  currentPage: number
  totalPages: number
  sortOption: string
  selectedCategory?: string
  selectedPerformers: string[]
  selectedTags: string[]
  activeFilters: {
    category?: string
    performers?: number
    tags?: number
  }
  categoryTitle?: string
  categoryDescription?: string | null
  basePath?: string
}

export function VideosPageClient({
  videos,
  categories,
  performers,
  tags,
  totalCount,
  currentPage,
  totalPages,
  sortOption,
  selectedCategory,
  selectedPerformers,
  selectedTags,
  activeFilters,
  categoryTitle,
  categoryDescription,
  basePath = "/videos",
}: VideosPageClientProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const buildSortUrl = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", sort)
    params.set("page", "1")
    return `${basePath}?${params.toString()}`
  }

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    return `${basePath}?${params.toString()}`
  }

  // Count active filters
  const activeFilterCount =
    (selectedCategory ? 1 : 0) + selectedPerformers.length + selectedTags.length

  return (
    <div className="pt-8 pb-12 flex flex-col gap-12 flex-1 px-4 md:px-8">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col items-start">
          <h2 className="text-center font-montserrat text-[22px] font-bold leading-[48px] mb-[15px]" style={{ color: "var(--text-primary)" }}>
            {categoryTitle || activeFilters.category || "Vídeos"}
            {(activeFilterCount > 0 || categoryTitle) && (
              <span className="text-[16px] font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                ({totalCount} resultados)
              </span>
            )}
          </h2>
          {categoryDescription && (
            <p className="text-sm mb-4 max-w-2xl" style={{ color: "var(--text-muted)" }}>{categoryDescription}</p>
          )}
          <div className="flex gap-2 flex-wrap">
            {/* Sort Dropdown */}
            <div className="relative group">
              <button className="font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] flex items-center gap-2 cursor-pointer" style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}>
                <ArrowUpDown size={14} />
                {sortOption === "newest" && "Más recientes"}
                {sortOption === "popular" && "Populares"}
                {sortOption === "oldest" && "Más antiguos"}
                {sortOption === "title" && "A-Z"}
              </button>
              <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-10 min-w-[150px]">
                <div className="border" style={{ backgroundColor: "var(--global-bg)", borderColor: "var(--footer-border-color)" }}>
                  <Link
                    href={buildSortUrl("newest")}
                    className="block px-4 py-2 text-sm hover:opacity-80 cursor-pointer"
                    style={{ color: sortOption === "newest" ? "var(--brand-color)" : "var(--text-primary)" }}
                  >
                    Más recientes
                  </Link>
                  <Link
                    href={buildSortUrl("popular")}
                    className="block px-4 py-2 text-sm hover:opacity-80 cursor-pointer"
                    style={{ color: sortOption === "popular" ? "var(--brand-color)" : "var(--text-primary)" }}
                  >
                    Populares
                  </Link>
                  <Link
                    href={buildSortUrl("oldest")}
                    className="block px-4 py-2 text-sm hover:opacity-80 cursor-pointer"
                    style={{ color: sortOption === "oldest" ? "var(--brand-color)" : "var(--text-primary)" }}
                  >
                    Más antiguos
                  </Link>
                  <Link
                    href={buildSortUrl("title")}
                    className="block px-4 py-2 text-sm hover:opacity-80 cursor-pointer"
                    style={{ color: sortOption === "title" ? "var(--brand-color)" : "var(--text-primary)" }}
                  >
                    A-Z
                  </Link>
                </div>
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: isFilterOpen || activeFilterCount > 0 ? "var(--brand-color)" : "var(--accent-color)",
                color: "var(--text-primary)",
              }}
            >
              Filtrar
              {activeFilterCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: "var(--text-primary)", color: "var(--brand-color)" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {activeFilters.category && (
                <span className="text-sm px-3 py-1 rounded" style={{ backgroundColor: "color-mix(in srgb, var(--brand-color) 20%, transparent)", color: "var(--brand-color)" }}>
                  Categoría: {activeFilters.category}
                </span>
              )}
              {activeFilters.performers && (
                <span className="text-sm px-3 py-1 rounded" style={{ backgroundColor: "color-mix(in srgb, var(--brand-color) 20%, transparent)", color: "var(--brand-color)" }}>
                  {activeFilters.performers} actriz(ces)
                </span>
              )}
              {activeFilters.tags && (
                <span className="text-sm px-3 py-1 rounded" style={{ backgroundColor: "color-mix(in srgb, var(--brand-color) 20%, transparent)", color: "var(--brand-color)" }}>
                  {activeFilters.tags} etiqueta(s)
                </span>
              )}
              <button
                onClick={() => router.push(basePath)}
                className="text-sm hover:opacity-80 underline"
                style={{ color: "var(--text-muted)" }}
              >
                Borrar todos los filtros
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full">
        <div className={`grid gap-8 ${isFilterOpen ? "lg:grid-cols-[300px_1fr]" : "grid-cols-1"}`}>
          {/* Sidebar */}
          {isFilterOpen && (
            <div className="lg:block">
              <VideoFiltersSidebar
                categories={categories}
                performers={performers}
                tags={tags}
                selectedCategory={selectedCategory}
                selectedPerformers={selectedPerformers}
                selectedTags={selectedTags}
              />
            </div>
          )}

          {/* Video Grid */}
          <div className="w-full">
            {videos.length > 0 ? (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 ${
                  isFilterOpen ? "lg:grid-cols-2" : "lg:grid-cols-3"
                } gap-x-4 gap-y-8`}
              >
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    videoId={video.id}
                    title={video.title}
                    subtitle={video.subtitle}
                    views={video.views}
                    likes={video.likes}
                    imageUrl={video.imageUrl}
                    previewUrl={video.previewUrl}
                    previewStartTime={video.previewStartTime}
                    previewEndTime={video.previewEndTime}
                    isVerified={video.isVerified}
                    slug={video.slug}
                    variant="below"
                    category={video.category}
                    performers={video.performers}
                    publishedAt={video.publishedAt}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: "var(--text-muted)" }}>No hay videos disponibles</p>
                <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                  Prueba a cambiar los filtros o buscar otra cosa
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                {currentPage > 1 && (
                  <Link
                    href={buildPageUrl(currentPage - 1)}
                    className="px-4 py-2 font-montserrat text-sm hover:opacity-80 transition-colors"
                    style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}
                  >
                    Anterior
                  </Link>
                )}

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Link
                        key={pageNum}
                        href={buildPageUrl(pageNum)}
                        className="px-3 py-2 font-montserrat text-sm transition-colors"
                        style={{
                          backgroundColor: currentPage === pageNum ? "var(--brand-color)" : "color-mix(in srgb, var(--text-primary) 10%, transparent)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}
                </div>

                {currentPage < totalPages && (
                  <Link
                    href={buildPageUrl(currentPage + 1)}
                    className="px-4 py-2 font-montserrat text-sm hover:opacity-80 transition-colors"
                    style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}
                  >
                    Siguiente
                  </Link>
                )}
              </div>
            )}

            {/* Results count */}
            <div className="text-center mt-6">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Mostrando {Math.min((currentPage - 1) * 12 + 1, totalCount)}-
                {Math.min(currentPage * 12, totalCount)} de {totalCount} videos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
