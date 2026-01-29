"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ActressesGrid } from "@/components/actresses-grid"
import { CtaBanner } from "@/components/cta-banner"
import { ArrowUpDown, Filter, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
    <main className="min-h-screen flex flex-col font-sans bg-black text-white">
      <div className="pt-8 pb-12 flex flex-col gap-12 flex-1 px-4 md:px-8">
        <div className="w-full">
          <div className="flex flex-col gap-4">
            {/* Title and count section */}
            <div className="flex flex-col gap-[10px]">
              <h1
                className="font-montserrat font-bold"
                style={{
                  color: "#E5E7EB",
                  fontSize: "30px",
                  lineHeight: "36px",
                }}
              >
                Actrices
              </h1>
              <p className="text-white font-montserrat text-base font-normal">
                Descubre talentosos intérpretes en nuestra base de medios
              </p>
              <p className="text-white font-montserrat text-sm font-normal">
                Mostrando {totalCount > 0 ? skip + 1 : 0}-{Math.min(skip + pageSize, totalCount)} de{" "}
                {totalCount.toLocaleString()} modelos
              </p>
            </div>

            <div className="flex justify-between items-center gap-4 flex-wrap">
              {/* Left side - filter buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleSortChange("popularity")}
                  className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] flex items-center gap-2 transition-colors ${
                    sortOption === "popularity" ? "bg-[#FA4860]" : "bg-[#00B1DE] hover:bg-[#00a0c8]"
                  }`}
                >
                  <ArrowUpDown size={14} />
                  Relevancia
                </button>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] cursor-pointer flex items-center gap-2 transition-colors ${
                    isFilterOpen ? "bg-[#FA4860]" : "bg-[#00B1DE] hover:bg-[#00a0c8]"
                  }`}
                >
                  <Filter size={14} />
                  Filtrar
                </button>
                {(letterFilter && letterFilter !== "Todo") && (
                  <button
                    onClick={clearFilters}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] flex items-center gap-2 transition-colors"
                  >
                    <X size={14} />
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Right side - sort dropdown */}
              <div className="flex items-center gap-4">
                <select
                  className="font-montserrat text-white text-base font-normal cursor-pointer"
                  style={{
                    background: "#00B1DE",
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
              <aside className="w-full text-white font-montserrat">
                <h3 className="text-white font-montserrat text-[18px] font-semibold leading-[28px] mb-6">
                  Filtros:
                </h3>

                <p className="text-white font-montserrat text-[14px] font-medium leading-[20px] mb-3">
                  Alfabético:
                </p>

                {/* Alphabet Filter */}
                <div className="grid grid-cols-3 gap-2 mb-8">
                  {alphabetGroups.map((group) => (
                    <button
                      key={group}
                      onClick={() => handleLetterChange(group)}
                      className={cn(
                        "h-10 text-sm font-medium transition-colors",
                        activeLetterGroup === group
                          ? "bg-[#FA4860] text-white"
                          : "bg-[#00B1DE] text-white hover:bg-[#00a0c8]"
                      )}
                    >
                      {group}
                    </button>
                  ))}
                </div>

                <button
                  onClick={clearFilters}
                  className="w-full bg-[#FA4860] text-white py-4 font-bold text-sm tracking-wide hover:bg-[#fa4860]/90 transition-colors"
                >
                  LIMPIAR TODOS LOS FILTROS
                </button>
              </aside>
            )}

            <div className={isFilterOpen ? "" : "w-full"}>
              {actresses.length > 0 ? (
                <ActressesGrid actresses={actresses} isFilterOpen={isFilterOpen} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No hay actrices disponibles</p>
                  {letterFilter && letterFilter !== "Todo" && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-[#00B1DE] hover:underline"
                    >
                      Limpiar filtros y ver todas
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
                  className="px-4 py-2 bg-[#00B1DE] text-white font-montserrat text-sm hover:bg-[#00a0c8] transition-colors"
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
                      className={`px-3 py-2 font-montserrat text-sm transition-colors ${
                        currentPage === pageNum
                          ? "bg-[#FA4860] text-white"
                          : "bg-gray-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  )
                })}
              </div>

              {currentPage < totalPages && (
                <Link
                  href={buildUrl({ page: currentPage + 1 })}
                  className="px-4 py-2 bg-[#00B1DE] text-white font-montserrat text-sm hover:bg-[#00a0c8] transition-colors"
                >
                  Siguiente
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA Banner at the bottom */}
      <CtaBanner
        title="The Bukkake Degree"
        description="Lorem ipsum dolor sit amet consectetur.Lorem ipsum dolor sit amet consectetur."
        buttonText="SUBSCRÍBETE"
        backgroundImage="/images/red-lips-bg.jpg"
      />
    </main>
  )
}
