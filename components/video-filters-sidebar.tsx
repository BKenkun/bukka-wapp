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

  const [activeAlphabet, setActiveAlphabet] = useState("All")
  const [localCategory, setLocalCategory] = useState(selectedCategory || "")
  const [localPerformers, setLocalPerformers] = useState<string[]>(selectedPerformers)
  const [localTags, setLocalTags] = useState<string[]>(selectedTags)

  // Get available first letters from performers
  const availableLetters = [...new Set(
    performers.map(p => p.name.charAt(0).toUpperCase())
  )].sort()

  // Filter performers by alphabet
  const filteredPerformers = performers.filter((performer) => {
    if (activeAlphabet === "All") return true
    const firstLetter = performer.name.charAt(0).toUpperCase()
    return firstLetter === activeAlphabet
  })

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.set("page", "1")

    if (localCategory) {
      params.set("category", localCategory)
    } else {
      params.delete("category")
    }

    if (localPerformers.length > 0) {
      params.set("performers", localPerformers.join(","))
    } else {
      params.delete("performers")
    }

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
    setActiveAlphabet("All")
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      applyFilters()
    }, 300)
    return () => clearTimeout(timeout)
  }, [localCategory, localPerformers, localTags])

  return (
    <aside className="w-full font-montserrat" style={{ color: "var(--text-primary)" }}>
      <h3 className="font-montserrat text-[18px] font-semibold leading-[28px] mb-6" style={{ color: "var(--text-primary)" }}>
        Filters:
      </h3>

      {/* Categories */}
      <div className="mb-8">
        <p className="font-montserrat text-[14px] font-medium leading-[20px] mb-3" style={{ color: "var(--text-primary)" }}>
          Categories:
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                !localCategory ? "border-[var(--brand-color)]" : "border-[var(--brand-color)]"
              )}
              style={{
                backgroundColor: !localCategory ? "var(--brand-color)" : "transparent",
                borderColor: "var(--brand-color)",
              }}
            >
              {!localCategory && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
            </div>
            <span className="text-[14px]">All</span>
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
                className="w-5 h-5 rounded-full border flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: localCategory === category.slug ? "var(--brand-color)" : "transparent",
                  borderColor: "var(--brand-color)",
                }}
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

      {/* Performers */}
      <div className="mb-8">
        <p className="font-montserrat text-[14px] font-medium leading-[20px] mb-3" style={{ color: "var(--text-primary)" }}>
          Performers:
        </p>

        {/* Alphabet Filter - only available letters */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setActiveAlphabet("All")}
            className="h-8 text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeAlphabet === "All" ? "var(--brand-color)" : "color-mix(in srgb, var(--brand-color) 20%, transparent)",
              color: "var(--text-primary)",
            }}
          >
            All
          </button>
          {availableLetters.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveAlphabet(letter)}
              className="h-8 text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeAlphabet === letter ? "var(--brand-color)" : "color-mix(in srgb, var(--brand-color) 20%, transparent)",
                color: "var(--text-primary)",
              }}
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
          {filteredPerformers.map((performer) => (
            <label key={performer.id} className="flex items-center gap-3 cursor-pointer">
              <div
                className="w-5 h-5 border flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: localPerformers.includes(performer.slug) ? "var(--brand-color)" : "transparent",
                  borderColor: "var(--brand-color)",
                }}
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
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No performers in this range</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-8">
        <p className="font-montserrat text-[14px] font-medium leading-[20px] mb-3" style={{ color: "var(--text-primary)" }}>
          Tags:
        </p>
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-3 cursor-pointer">
              <div
                className="w-5 h-5 border flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: localTags.includes(tag.slug) ? "var(--brand-color)" : "transparent",
                  borderColor: "var(--brand-color)",
                }}
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
        Clear all filters
      </button>
    </aside>
  )
}
