"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Category {
  id: string
  slug: string
  name: string
}

interface EditPostFormProps {
  postId: string
  initialTitle: string
  initialContent: string
  initialCategoryId: string
  categories: Category[]
}

export function EditPostForm({
  postId,
  initialTitle,
  initialContent,
  initialCategoryId,
  categories,
}: EditPostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: initialTitle,
    content: initialContent,
    categoryId: initialCategoryId,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError("Title is required")
      return
    }

    if (formData.title.length < 5) {
      setError("Title must be at least 5 characters")
      return
    }

    if (!formData.content.trim()) {
      setError("Content is required")
      return
    }

    if (formData.content.length < 20) {
      setError("Content must be at least 20 characters")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error updating topic")
      }

      router.push(`/foro/${postId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating topic")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 font-montserrat text-sm">
          {error}
        </div>
      )}

      {/* Categoría */}
      <div>
        <label className="block font-montserrat text-white text-[14px] font-medium mb-2">
          Category
        </label>
        <select
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 font-montserrat text-[16px] focus:outline-none focus:border-[#00B1DE]"
          disabled={isSubmitting}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Título */}
      <div>
        <label className="block font-montserrat text-white text-[14px] font-medium mb-2">
          Topic title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Write a descriptive title..."
          className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 font-montserrat text-[16px] placeholder:text-white/30 focus:outline-none focus:border-[#00B1DE]"
          disabled={isSubmitting}
          maxLength={200}
        />
        <p className="mt-1 text-white/30 text-xs font-montserrat text-right">
          {formData.title.length}/200
        </p>
      </div>

      {/* Contenido */}
      <div>
        <label className="block font-montserrat text-white text-[14px] font-medium mb-2">
          Content
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Write your topic content..."
          rows={12}
          className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 font-montserrat text-[16px] placeholder:text-white/30 focus:outline-none focus:border-[#00B1DE] resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* Botones */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="font-montserrat text-white/60 text-[14px] font-medium hover:text-white transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#00B1DE] text-white px-8 py-3 font-montserrat text-[16px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  )
}
