"use client"

import Link from "next/link"

interface BlogCategoryFilterProps {
  categories: { slug: string; name: string }[]
  currentCategory?: string
}

export function BlogCategoryFilter({ categories, currentCategory }: BlogCategoryFilterProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/news"
          className={`px-6 py-2 font-['Montserrat'] text-base font-normal text-center transition-colors ${
            !currentCategory
              ? "bg-[#06B6D4] text-white"
              : "bg-transparent text-white hover:bg-[#06B6D4]/20"
          }`}
        >
          Todos
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/blog?categoria=${category.slug}`}
            className={`px-6 py-2 font-['Montserrat'] text-base font-normal text-center transition-colors ${
              currentCategory === category.slug
                ? "bg-[#06B6D4] text-white"
                : "bg-transparent text-white hover:bg-[#06B6D4]/20"
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
