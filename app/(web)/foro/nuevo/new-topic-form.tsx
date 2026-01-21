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

  const displayName = userName || "Usuario"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError("El título es requerido")
      return
    }

    if (formData.title.length < 5) {
      setError("El título debe tener al menos 5 caracteres")
      return
    }

    if (!formData.content.trim()) {
      setError("El contenido es requerido")
      return
    }

    if (formData.content.length < 20) {
      setError("El contenido debe tener al menos 20 caracteres")
      return
    }

    if (!formData.categoryId) {
      setError("Debes seleccionar una categoría")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al crear el tema")
      }

      const post = await response.json()
      router.push(`/foro/${post.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el tema")
      setIsSubmitting(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === formData.categoryId)

  return (
    <form onSubmit={handleSubmit}>
      {/* User Info Header */}
      <div className="p-6 border-b border-[#333]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00B1DE]/20 flex items-center justify-center">
            <span className="text-[#00B1DE] font-montserrat font-semibold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-montserrat text-white text-[14px] font-medium">
              Publicando como
            </p>
            <p className="font-montserrat text-[#00B1DE] text-[16px] font-semibold">
              {displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 font-montserrat text-sm flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {/* Categoría */}
        <div>
          <label className="flex items-center gap-2 font-montserrat text-white text-[14px] font-medium mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00B1DE"
              strokeWidth="2"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            Categoría
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setFormData({ ...formData, categoryId: category.id })}
                disabled={isSubmitting}
                className={`p-3 border text-left transition-all ${
                  formData.categoryId === category.id
                    ? "border-[#00B1DE] bg-[#00B1DE]/10"
                    : "border-[#333] bg-[#1a1a1a] hover:border-[#444]"
                }`}
              >
                <span
                  className={`font-montserrat text-[14px] font-medium ${
                    formData.categoryId === category.id ? "text-[#00B1DE]" : "text-white"
                  }`}
                >
                  {category.name}
                </span>
              </button>
            ))}
          </div>
          {selectedCategory?.description && (
            <p className="mt-3 text-white/50 text-sm font-montserrat flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mt-0.5 flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              {selectedCategory.description}
            </p>
          )}
        </div>

        {/* Título */}
        <div>
          <label className="flex items-center gap-2 font-montserrat text-white text-[14px] font-medium mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00B1DE"
              strokeWidth="2"
            >
              <polyline points="4 7 4 4 20 4 20 7"></polyline>
              <line x1="9" y1="20" x2="15" y2="20"></line>
              <line x1="12" y1="4" x2="12" y2="20"></line>
            </svg>
            Título del tema
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Escribe un título descriptivo..."
            className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 font-montserrat text-[16px] placeholder:text-white/30 focus:outline-none focus:border-[#00B1DE] transition-colors"
            disabled={isSubmitting}
            maxLength={200}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-white/30 text-xs font-montserrat">
              Mínimo 5 caracteres
            </p>
            <p
              className={`text-xs font-montserrat ${
                formData.title.length > 180 ? "text-yellow-400" : "text-white/30"
              }`}
            >
              {formData.title.length}/200
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div>
          <label className="flex items-center gap-2 font-montserrat text-white text-[14px] font-medium mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00B1DE"
              strokeWidth="2"
            >
              <line x1="17" y1="10" x2="3" y2="10"></line>
              <line x1="21" y1="6" x2="3" y2="6"></line>
              <line x1="21" y1="14" x2="3" y2="14"></line>
              <line x1="17" y1="18" x2="3" y2="18"></line>
            </svg>
            Contenido
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Escribe el contenido de tu tema. Sé claro y detallado para obtener mejores respuestas..."
            rows={10}
            className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 font-montserrat text-[16px] placeholder:text-white/30 focus:outline-none focus:border-[#00B1DE] resize-none transition-colors"
            disabled={isSubmitting}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-white/30 text-xs font-montserrat">
              Mínimo 20 caracteres
            </p>
            <p
              className={`text-xs font-montserrat ${
                formData.content.length >= 20 ? "text-green-400" : "text-white/30"
              }`}
            >
              {formData.content.length} caracteres
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-[#333] bg-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="font-montserrat text-white/60 text-[14px] font-medium hover:text-white transition-colors flex items-center gap-2"
            disabled={isSubmitting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
                Publicando...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Publicar Tema
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
