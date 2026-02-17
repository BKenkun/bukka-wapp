"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

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

interface VideoFiltersSidebarProps {
  categories: Category[]
  performers: Performer[]
  tags: Tag[]
  selectedCategory?: string
  selectedPerformers?: string[]
  selectedTags?: string[]
}

export function VideoFiltersSidebar({
  categories,
  performers,
  tags,
  selectedCategory,
  selectedPerformers = [],
  selectedTags = [],
}: VideoFiltersSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeAlphabet, setActiveAlphabet] = useState("Todo")
  const [localCategory, setLocalCategory] = useState(selectedCategory || "")
  const [localPerformers, setLocalPerformers] = useState<string[]>(selectedPerformers)
  const [localTags, setLocalTags] = useState<string[]>(selectedTags)

  const alphabetGroups = ["Todo", "A-C", "D-F", "G-I", "J-L", "M-O", "P-R", "S-U", "V-Z"]

  // Filter performers by alphabet
  const filteredPerformers = performers.filter((performer) => {
    if (activeAlphabet === "Todo") return true
    const firstLetter = performer.name.charAt(0).toUpperCase()
    const [start, end] = activeAlphabet.split("-")
    return firstLetter >= start && firstLetter <= end
  })

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Reset page
    params.set("page", "1")

    // Category
    if (localCategory) {
      params.set("category", localCategory)
    } else {
      params.delete("category")
    }

    // Performers
    if (localPerformers.length > 0) {
      params.set("performers", localPerformers.join(","))
    } else {
      params.delete("performers")
    }

    // Tags
    if (localTags.length > 0) {
      params.set("tags", localTags.join(","))
    } else {
      params.delete("tags")
    }

    router.push(`/videos?${params.toString()}`)
  }

  const clearFilters = () => {
    setLocalCategory("")
    setLocalPerformers([])
    setLocalTags([])
    setActiveAlphabet("Todo")
    router.push("/videos")
  }

  const togglePerformer = (slug: string) => {
    setLocalPerformers((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    )
  }

  const toggleTag = (slug: string) => {
    setLocalTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    )
  }

  // Auto-apply filters when selection changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      applyFilters()
    }, 300)
    return () => clearTimeout(timeout)
  }, [localCategory, localPerformers, localTags])

  return (
    <aside className="w-full font-montserrat" style={{ color: "var(--text-primary)" }}>
      <h3 className="font-montserrat text-[18px] font-semibold leading-[28px] mb-6" style={{ color: "var(--text-primary)" }}>
        Filtros:
      </h3>

      {/* Categories */}
      <div className="mb-8">
        <p className="font-montserrat text-[14px] font-medium leading-[20px] mb-3" style={{ color: "var(--text-primary)" }}>
          Categorías:
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                "w-5 h-5 rounded-full border border-[var(--brand-color)] flex items-center justify-center transition-colors",
                !localCategory ? "bg-[var(--accent-color)] border-[var(--accent-color)]" : ""
              )}
            >
              {!localCategory && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
            </div>
            <span className="text-[14px]">Todas</span>
            <input
              type="radio"
              name="category"
              className="hidden"
              checked={!localCategory}
              onChange={() => setLocalCategory("")}
            />
          </label>
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-3 cursor-pointer">
              <div
                className={cn(
                  "w-5 h-5 rounded-full border border-[var(--brand-color)] flex items-center justify-center transition-colors",
                  localCategory === category.slug ? "bg-[var(--accent-color)] border-[var(--accent-color)]" : ""
                )}
              >
                {localCategory === category.slug && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                )}
              </div>
              <span className="text-[14px]">{category.name}</span>
              <input
                type="radio"
                name="category"
                className="hidden"
                checked={localCategory === category.slug}
                onChange={() => setLocalCategory(category.slug)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Performers/Actrices */}
      <div className="mb-8">
        <p className="font-montserrat text-[14px] font-medium leading-[20px] mb-3" style={{ color: "var(--text-primary)" }}>
          Actrices:
        </p>

        {/* Alphabet Filter */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {alphabetGroups.map((group) => (
            <button
              key={group}
              onClick={() => setActiveAlphabet(group)}
              className="h-8 text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeAlphabet === group ? "var(--accent-color)" : "color-mix(in srgb, var(--text-primary) 15%, transparent)",
                color: "var(--text-primary)",
              }}
            >
              {group}
            </button>
          ))}
        </div>

        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
          {filteredPerformers.map((performer) => (
            <label key={performer.id} className="flex items-center gap-3 cursor-pointer">
              <div
                className={cn(
                  "w-5 h-5 border border-[var(--brand-color)] flex items-center justify-center transition-colors",
                  localPerformers.includes(performer.slug)
                    ? "bg-[var(--accent-color)] border-[var(--accent-color)]"
                    : ""
                )}
              >
                {localPerformers.includes(performer.slug) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-4 h-4 text-white"
                    strokeWidth={3}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-[14px]">{performer.name}</span>
              <input
                type="checkbox"
                className="hidden"
                checked={localPerformers.includes(performer.slug)}
                onChange={() => togglePerformer(performer.slug)}
              />
            </label>
          ))}
          {filteredPerformers.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No hay actrices en este rango</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-8">
        <p className="font-montserrat text-[14px] font-medium leading-[20px] mb-3" style={{ color: "var(--text-primary)" }}>
          Etiquetas:
        </p>
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-3 cursor-pointer">
              <div
                className={cn(
                  "w-5 h-5 border border-[var(--brand-color)] flex items-center justify-center transition-colors",
                  localTags.includes(tag.slug) ? "bg-[var(--accent-color)] border-[var(--accent-color)]" : ""
                )}
              >
                {localTags.includes(tag.slug) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-4 h-4 text-white"
                    strokeWidth={3}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-[14px] capitalize">{tag.name}</span>
              <input
                type="checkbox"
                className="hidden"
                checked={localTags.includes(tag.slug)}
                onChange={() => toggleTag(tag.slug)}
              />
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="w-full py-4 font-bold text-sm tracking-wide hover:opacity-90 transition-colors"
        style={{ backgroundColor: "var(--brand-color)", color: "var(--text-primary)" }}
      >
        Borrar todos los filtros
      </button>
    </aside>
  )
}
