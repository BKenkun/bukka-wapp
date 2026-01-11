"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface Reply {
  id: string
  author: string
  authorImage?: string | null
  tier: string
  timeAgo: string
  content: string
}

interface ForumRepliesProps {
  replies: Reply[]
  postId: string
  isLocked: boolean
}

// Helper for tier badge
function getTierBadge(tier: string) {
  const badges: Record<string, { label: string; textColor: string; bgColor: string }> = {
    FREE: { label: "Free", textColor: "#6B7280", bgColor: "#E5E7EB" },
    SILVER: { label: "Silver", textColor: "#6B7280", bgColor: "#E5E7EB" },
    GOLD: { label: "Gold", textColor: "#854D0E", bgColor: "#FEF9C3" },
    PLATINUM: { label: "Platinum", textColor: "#6B7280", bgColor: "#E5E7EB" },
    DIAMOND: { label: "Diamond", textColor: "#1E40AF", bgColor: "#DBEAFE" },
  }
  return badges[tier] || null
}

export function ForumReplies({ replies, postId, isLocked }: ForumRepliesProps) {
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/forum/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "Error al enviar respuesta")
        return
      }

      setReplyContent("")
      // Reload page to show new reply
      window.location.reload()
    } catch {
      alert("Error al enviar respuesta")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <h3 className="font-montserrat text-white text-[18px] font-semibold leading-[28px] mt-8 mb-4">
        {replies.length} Comentarios
      </h3>

      {replies.length > 0 && (
        <div className="bg-[rgba(75,85,99,0.21)]">
          {replies.map((reply) => {
            const tierBadge = getTierBadge(reply.tier)

            return (
              <div key={reply.id} className="p-6 border-b border-[#E5E7EB] last:border-b-0">
                {/* Reply Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-600">
                    {reply.authorImage ? (
                      <Image
                        src={reply.authorImage}
                        alt={reply.author}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                        {reply.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="font-montserrat text-white text-[16px] font-medium leading-[24px]">
                    {reply.author}
                  </span>
                  {tierBadge && (
                    <span
                      className="font-montserrat text-[12px] font-medium px-2 py-0.5"
                      style={{
                        color: tierBadge.textColor,
                        backgroundColor: tierBadge.bgColor,
                      }}
                    >
                      {tierBadge.label}
                    </span>
                  )}
                  <span className="font-montserrat text-[#9CA3AF] text-[14px] font-normal">{reply.timeAgo}</span>
                </div>

                {/* Reply Content */}
                <div className="mb-3">
                  <p className="font-montserrat text-white text-[14px] font-normal leading-[20px] whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </div>

                {/* Reply Actions */}
                <div className="flex items-center gap-4">
                  {/* Like */}
                  <div className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4B5563"
                      strokeWidth="2"
                    >
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    <span className="font-montserrat text-white text-[14px] font-normal">0</span>
                  </div>

                  {/* Reply */}
                  {!isLocked && (
                    <div className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#4B5563"
                        strokeWidth="2"
                      >
                        <polyline points="9 17 4 12 9 7"></polyline>
                        <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
                      </svg>
                      <span className="font-montserrat text-white text-[14px] font-normal">Responder</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {replies.length === 0 && (
        <div className="bg-[rgba(75,85,99,0.21)] p-8 text-center">
          <p className="text-white/60 font-montserrat">No hay respuestas aún. ¡Sé el primero en comentar!</p>
        </div>
      )}

      {/* Reply Form */}
      {!isLocked ? (
        <form onSubmit={handleSubmitReply} className="mt-6">
          <h4 className="font-montserrat text-white text-[16px] font-semibold mb-4">Escribe una respuesta</h4>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            className="w-full bg-[rgba(75,85,99,0.21)] border border-[#E5E7EB] text-white p-4 font-montserrat text-[14px] min-h-[120px] placeholder:text-white/40 focus:outline-none focus:border-[#00B1DE]"
            required
          />
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={isSubmitting || !replyContent.trim()}
              className="bg-[#00B1DE] text-white px-6 py-3 font-montserrat text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00B1DE]/90 transition-colors"
            >
              {isSubmitting ? "Enviando..." : "Publicar Respuesta"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 bg-[rgba(75,85,99,0.21)] p-4 text-center">
          <p className="text-white/60 font-montserrat">Este tema está cerrado y no acepta nuevas respuestas.</p>
        </div>
      )}

      {/* Report link */}
      <div className="flex justify-end mt-4">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4B5563"
            strokeWidth="2"
          >
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
          <span className="font-montserrat text-[#4B5563] text-[14px] font-normal">Reportar</span>
        </div>
      </div>
    </>
  )
}
