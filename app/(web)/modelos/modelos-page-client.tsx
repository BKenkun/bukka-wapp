"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ActressesGrid } from "@/components/actresses-grid"
import { ArrowUpDown, Filter, X } from "lucide-react"
import Link from "next/link"


interface Actress {
  id: string
  slug: string
  name: string
  imageUrl: string
  videoCount: number
  totalViews?: number
  verified: boolean
}

interface ModelosPageClientProps {
  actresses: Actress[]
  totalCount: number
  currentPage: number
  totalPages: number
  sortOption: string
  letterFilter: string
  skip: number
  pageSize: number
}

const alphabetGroups = ["Todo", "A-C", "D-F", "G-I", "J-L", "M-O", "P-R", "S-U", "V-Z"]

export function ModelosPageClient({
  actresses,
  totalCount,
  currentPage,
  totalPages,
  sortOption,
  letterFilter,
  skip,
  pageSize,
}: ModelosPageClientProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const router = useRouter()

  // Build URL with current filters
  const buildUrl = (params: { sort?: string; letter?: string; page?: number }) => {
    const urlParams = new URLSearchParams()

    const newSort = params.sort ?? sortOption
    const newLetter = params.letter ?? letterFilter
    const newPage = params.page ?? 1

    if (newSort && newSort !== "popularity") urlParams.set("sort", newSort)
    if (newLetter && newLetter !== "Todo" && newLetter !== "") urlParams.set("letter", newLetter)
    if (newPage > 1) urlParams.set("page", String(newPage))

    const queryString = urlParams.toString()
    return `/modelos${queryString ? `?${queryString}` : ""}`
  }

  const handleSortChange = (newSort: string) => {
    router.push(buildUrl({ sort: newSort, page: 1 }))
  }

  const handleLetterChange = (letter: string) => {
    router.push(buildUrl({ letter, page: 1 }))
  }

  const clearFilters = () => {
    router.push("/modelos")
  }

  const activeLetterGroup = letterFilter || "Todo"

  return (
    <main className="min-h-screen flex flex-col font-sans">
      <div className="pt-8 pb-12 flex flex-col gap-12 flex-1 px-4 md:px-8">
        <div className="w-full">
          <div className="flex flex-col gap-4">
            {/* Title and count section */}
            <div className="flex flex-col gap-[10px]">
              <h1
                className="font-montserrat font-bold"
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "30px",
                  lineHeight: "36px",
                }}
              >
                Actrices
              </h1>
              <p className="text-base font-normal" style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}>
                Descubre talentosos intérpretes en nuestra base de medios
              </p>
              <p className="text-sm font-normal" style={{ color: "var(--text-muted)", fontFamily: "var(--global-font)" }}>
                Mostrando {totalCount > 0 ? skip + 1 : 0}-{Math.min(skip + pageSize, totalCount)} de{" "}
                {totalCount.toLocaleString()} modelos
              </p>
            </div>

            <div className="flex justify-between items-center gap-4 flex-wrap">
              {/* Left side - filter buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleSortChange("popularity")}
                  className="text-[14px] font-normal leading-[14px] px-[18px] py-[7px] flex items-center gap-2 transition-colors"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--global-font)",
                    backgroundColor: sortOption === "popularity" ? "var(--brand-color)" : "var(--accent-color)",
                  }}
                >
                  <ArrowUpDown size={14} />
                  Relevancia
                </button>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="text-[14px] font-normal leading-[14px] px-[18px] py-[7px] cursor-pointer flex items-center gap-2 transition-colors"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--global-font)",
                    backgroundColor: isFilterOpen ? "var(--brand-color)" : "var(--accent-color)",
                  }}
                >
                  <Filter size={14} />
                  Filtrar
                </button>
                {(letterFilter && letterFilter !== "Todo") && (
                  <button
                    onClick={clearFilters}
                    className="text-[14px] font-normal leading-[14px] px-[18px] py-[7px] flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "var(--global-font)",
                      backgroundColor: "color-mix(in srgb, var(--text-primary) 15%, transparent)",
                    }}
                  >
                    <X size={14} />
                    Borrar todos los filtros
                  </button>
                )}
              </div>

              {/* Right side - sort dropdown */}
              <div className="flex items-center gap-4">
                <select
                  className="text-base font-normal cursor-pointer"
                  style={{
                    fontFamily: "var(--global-font)",
                    color: "var(--text-primary)",
                    background: "var(--accent-color)",
                    padding: "8px 12px",
                    border: "none",
                    outline: "none",
                  }}
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="popularity">Ordenar por Popularidad</option>
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                  <option value="name">Nombre A-Z</option>
                </select>
              </div>
            </div>
          </div>

          <div
            className={`mt-8 grid gap-8 ${
              isFilterOpen ? "lg:grid-cols-[300px_1fr]" : "grid-cols-1"
            }`}
          >
            {isFilterOpen && (
              <aside className="w-full" style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}>
                <h3 className="text-[18px] font-semibold leading-[28px] mb-6" style={{ color: "var(--text-primary)" }}>
                  Filtros:
                </h3>

                <p className="text-[14px] font-medium leading-[20px] mb-3" style={{ color: "var(--text-primary)" }}>
                  Alfabético:
                </p>

                {/* Alphabet Filter */}
                <div className="grid grid-cols-3 gap-2 mb-8">
                  {alphabetGroups.map((group) => (
                    <button
                      key={group}
                      onClick={() => handleLetterChange(group)}
                      className="h-10 text-sm font-medium transition-colors"
                      style={{
                        color: "var(--text-primary)",
                        backgroundColor: activeLetterGroup === group ? "var(--brand-color)" : "var(--accent-color)",
                      }}
                    >
                      {group}
                    </button>
                  ))}
                </div>

                <button
                  onClick={clearFilters}
                  className="w-full py-4 font-bold text-sm tracking-wide hover:opacity-90 transition-colors"
                  style={{ backgroundColor: "var(--brand-color)", color: "var(--text-primary)" }}
                >
                  Borrar todos los filtros
                </button>
              </aside>
            )}

            <div className={isFilterOpen ? "" : "w-full"}>
              {actresses.length > 0 ? (
                <ActressesGrid actresses={actresses} isFilterOpen={isFilterOpen} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg" style={{ color: "var(--text-muted)" }}>No hay actrices disponibles</p>
                  {letterFilter && letterFilter !== "Todo" && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 hover:underline"
                      style={{ color: "var(--accent-color)" }}
                    >
                      Borrar todos los filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {currentPage > 1 && (
                <Link
                  href={buildUrl({ page: currentPage - 1 })}
                  className="px-4 py-2 text-sm hover:opacity-90 transition-colors"
                  style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)", fontFamily: "var(--global-font)" }}
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
                      href={buildUrl({ page: pageNum })}
                      className="px-3 py-2 text-sm transition-colors"
                      style={{
                        fontFamily: "var(--global-font)",
                        color: "var(--text-primary)",
                        backgroundColor: currentPage === pageNum ? "var(--brand-color)" : "color-mix(in srgb, var(--text-primary) 10%, transparent)",
                      }}
                    >
                      {pageNum}
                    </Link>
                  )
                })}
              </div>

              {currentPage < totalPages && (
                <Link
                  href={buildUrl({ page: currentPage + 1 })}
                  className="px-4 py-2 text-sm hover:opacity-90 transition-colors"
                  style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)", fontFamily: "var(--global-font)" }}
                >
                  Siguiente
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

    </main>
  )
}
