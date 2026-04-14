"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Category {
  id: string
  slug: string
  name: string
  description: string | null
}

interface NewTopicFormProps {
  categories: Category[]
  userName: string
}

export function NewTopicForm({ categories, userName }: NewTopicFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    categoryId: categories[0]?.id || "",
  })

  const displayName = userName || "User"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) { setError("Title is required"); return }
    if (formData.title.length < 5) { setError("Title must be at least 5 characters"); return }
    if (!formData.content.trim()) { setError("Content is required"); return }
    if (formData.content.length < 20) { setError("Content must be at least 20 characters"); return }
    if (!formData.categoryId) { setError("You must select a category"); return }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Error creating topic") }
      const post = await response.json()
      router.push(`/forum/${post.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating topic")
      setIsSubmitting(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === formData.categoryId)

  return (
    <form onSubmit={handleSubmit}>
      {/* User Info Header */}
      <div className="p-6" style={{ borderBottom: "1px solid var(--border-color)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--accent-color) 20%, transparent)" }}>
            <span className="font-montserrat font-semibold text-lg" style={{ color: "var(--accent-color)" }}>
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-montserrat text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>Posting as</p>
            <p className="font-montserrat text-[16px] font-semibold" style={{ color: "var(--accent-color)" }}>{displayName}</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-6">
        {error && (
          <div className="px-4 py-3 font-montserrat text-sm flex items-center gap-3" style={{ backgroundColor: "color-mix(in srgb, var(--error-color) 20%, transparent)", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="flex items-center gap-2 font-montserrat text-[14px] font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            Category
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setFormData({ ...formData, categoryId: category.id })}
                disabled={isSubmitting}
                className="p-3 text-left transition-all"
                style={{
                  border: formData.categoryId === category.id ? "1px solid var(--accent-color)" : "1px solid var(--border-color)",
                  backgroundColor: formData.categoryId === category.id ? "color-mix(in srgb, var(--accent-color) 10%, transparent)" : "var(--global-bg)",
                }}
              >
                <span className="font-montserrat text-[14px] font-medium" style={{ color: formData.categoryId === category.id ? "var(--accent-color)" : "var(--text-primary)" }}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
          {selectedCategory?.description && (
            <p className="mt-3 text-sm font-montserrat flex items-start gap-2" style={{ color: "var(--text-muted)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              {selectedCategory.description}
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="flex items-center gap-2 font-montserrat text-[14px] font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2">
              <polyline points="4 7 4 4 20 4 20 7"></polyline>
              <line x1="9" y1="20" x2="15" y2="20"></line>
              <line x1="12" y1="4" x2="12" y2="20"></line>
            </svg>
            Topic Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Write a descriptive title..."
            className="w-full px-4 py-3 font-montserrat text-[16px] focus:outline-none transition-colors"
            style={{ backgroundColor: "var(--global-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
            disabled={isSubmitting}
            maxLength={200}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs font-montserrat" style={{ color: "var(--text-muted)" }}>Minimum 5 characters</p>
            <p className="text-xs font-montserrat" style={{ color: formData.title.length > 180 ? "var(--warning-color)" : "var(--text-muted)" }}>{formData.title.length}/200</p>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="flex items-center gap-2 font-montserrat text-[14px] font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2">
              <line x1="17" y1="10" x2="3" y2="10"></line>
              <line x1="21" y1="6" x2="3" y2="6"></line>
              <line x1="21" y1="14" x2="3" y2="14"></line>
              <line x1="17" y1="18" x2="3" y2="18"></line>
            </svg>
            Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write your topic content. Be clear and detailed for better replies..."
            rows={10}
            className="w-full px-4 py-3 font-montserrat text-[16px] focus:outline-none resize-none transition-colors"
            style={{ backgroundColor: "var(--global-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
            disabled={isSubmitting}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs font-montserrat" style={{ color: "var(--text-muted)" }}>Minimum 20 characters</p>
            <p className="text-xs font-montserrat" style={{ color: formData.content.length >= 20 ? "var(--success-color)" : "var(--text-muted)" }}>{formData.content.length} characters</p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6" style={{ borderTop: "1px solid var(--border-color)", backgroundColor: "var(--global-bg)" }}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="font-montserrat text-[14px] font-medium transition-colors flex items-center gap-2"
            style={{ color: "var(--text-muted)" }}
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Publishing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Publish Topic
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
