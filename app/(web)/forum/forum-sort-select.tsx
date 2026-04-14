"use client"

import { useRouter } from "next/navigation"

interface ForumSortSelectProps {
  currentSort: string
  categorySlug?: string
}

export function ForumSortSelect({ currentSort, categorySlug }: ForumSortSelectProps) {
  const router = useRouter()

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams()
    if (categorySlug) params.set("categoria", categorySlug)
    if (newSort !== "recent") params.set("orden", newSort)
    const queryString = params.toString()
    router.push(`/foro${queryString ? `?${queryString}` : ""}`)
  }

  const sortLabels: Record<string, string> = {
    recent: "Most recent",
    popular: "Most popular",
    replies: "Most replies",
  }

  return (
    <div className="relative">
      <select
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="appearance-none bg-[#00B1DE] px-4 py-2 pr-10 text-white font-montserrat text-[14px] cursor-pointer outline-none"
      >
        <option value="recent">Most recent</option>
        <option value="popular">Most popular</option>
        <option value="replies">Most replies</option>
      </select>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="8"
        viewBox="0 0 12 8"
        fill="none"
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      >
        <path
          d="M1 1.5L6 6.5L11 1.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
