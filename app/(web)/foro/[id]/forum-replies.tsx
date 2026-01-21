"use client"

import { useState, useRef, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"

interface Reply {
  id: string
  parentId?: string | null
  author: string
  authorId: string
  authorImage?: string | null
  tier: string
  timeAgo: string
  content: string
  likeCount: number
  isLiked: boolean
}

interface ForumRepliesProps {
  replies: Reply[]
  postId: string
  postContent: string
  postAuthor: string
  postLikeCount: number
  isPostLiked: boolean
  isLocked: boolean
  userId?: string | null
}

// Helper for tier badge
function getTierBadge(tier: string) {
  const badges: Record<string, { label: string; textColor: string; bgColor: string }> = {
    FREE: { label: "Free", textColor: "#6B7280", bgColor: "#E5E7EB" },
    Free: { label: "Free", textColor: "#6B7280", bgColor: "#E5E7EB" },
    SILVER: { label: "Silver", textColor: "#6B7280", bgColor: "#E5E7EB" },
    Silver: { label: "Silver", textColor: "#6B7280", bgColor: "#E5E7EB" },
    GOLD: { label: "Gold", textColor: "#854D0E", bgColor: "#FEF9C3" },
    Gold: { label: "Gold", textColor: "#854D0E", bgColor: "#FEF9C3" },
    PLATINUM: { label: "Platinum", textColor: "#6B7280", bgColor: "#E5E7EB" },
    Platinum: { label: "Platinum", textColor: "#6B7280", bgColor: "#E5E7EB" },
    DIAMOND: { label: "Diamond", textColor: "#1E40AF", bgColor: "#DBEAFE" },
    Diamond: { label: "Diamond", textColor: "#1E40AF", bgColor: "#DBEAFE" },
  }
  return badges[tier] || null
}

export function ForumReplies({
  replies: initialReplies,
  postId,
  postContent,
  postAuthor,
  postLikeCount: initialPostLikeCount,
  isPostLiked: initialIsPostLiked,
  isLocked,
  userId,
}: ForumRepliesProps) {
  const [replies, setReplies] = useState(initialReplies)
  const [postLikeCount, setPostLikeCount] = useState(initialPostLikeCount)
  const [isPostLiked, setIsPostLiked] = useState(initialIsPostLiked)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [likingPostId, setLikingPostId] = useState<string | null>(null)
  const [likingReplyId, setLikingReplyId] = useState<string | null>(null)
  const [replyingToId, setReplyingToId] = useState<string | null>(null) // ID of comment being replied to
  const [inlineReplyContent, setInlineReplyContent] = useState("")
  // Quote state
  const [quotedAuthor, setQuotedAuthor] = useState<string | null>(null)
  const [quotedContent, setQuotedContent] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inlineTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Group replies: top-level comments with their nested replies
  const groupedReplies = useMemo(() => {
    const topLevel: Reply[] = []
    const childrenMap: Record<string, Reply[]> = {}

    // First pass: separate top-level and children
    replies.forEach((reply) => {
      if (!reply.parentId) {
        topLevel.push(reply)
      } else {
        if (!childrenMap[reply.parentId]) {
          childrenMap[reply.parentId] = []
        }
        childrenMap[reply.parentId].push(reply)
      }
    })

    // Build groups
    return topLevel.map((parent) => ({
      parent,
      children: childrenMap[parent.id] || [],
    }))
  }, [replies])

  const handlePostLike = async () => {
    if (!userId || likingPostId) return

    setLikingPostId(postId)
    try {
      const res = await fetch(`/api/forum/posts/${postId}/like`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        setPostLikeCount(data.likeCount)
        setIsPostLiked(data.liked)
      }
    } catch (error) {
      console.error("Error toggling post like:", error)
    } finally {
      setLikingPostId(null)
    }
  }

  const handleReplyLike = async (replyId: string) => {
    if (!userId || likingReplyId) return

    setLikingReplyId(replyId)
    try {
      const res = await fetch(`/api/forum/replies/${replyId}/like`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        setReplies((prev) =>
          prev.map((reply) =>
            reply.id === replyId
              ? { ...reply, likeCount: data.likeCount, isLiked: data.liked }
              : reply
          )
        )
      }
    } catch (error) {
      console.error("Error toggling reply like:", error)
    } finally {
      setLikingReplyId(null)
    }
  }

  const handleQuotePost = () => {
    setQuotedAuthor(postAuthor)
    setQuotedContent(postContent.substring(0, 300) + (postContent.length > 300 ? "..." : ""))
    setReplyContent("")
    setReplyingToId(null)
    textareaRef.current?.focus()
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const handleQuoteReply = (reply: Reply) => {
    setQuotedAuthor(reply.author)
    setQuotedContent(reply.content.substring(0, 300) + (reply.content.length > 300 ? "..." : ""))
    setReplyContent("")
    setReplyingToId(null)
    textareaRef.current?.focus()
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const cancelQuote = () => {
    setQuotedAuthor(null)
    setQuotedContent(null)
  }

  const handleReplyTo = (replyId: string) => {
    setReplyingToId(replyId)
    setInlineReplyContent("")
    // Focus after state update
    setTimeout(() => {
      inlineTextareaRef.current?.focus()
    }, 100)
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Build content with quote if exists
      let finalContent = replyContent
      if (quotedAuthor && quotedContent) {
        finalContent = `> **${quotedAuthor}** escribió:\n> ${quotedContent}\n\n${replyContent}`
      }

      const res = await fetch(`/api/forum/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: finalContent,
          parentId: null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "Error al enviar respuesta")
        return
      }

      setReplyContent("")
      setQuotedAuthor(null)
      setQuotedContent(null)
      window.location.reload()
    } catch {
      alert("Error al enviar respuesta")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitInlineReply = async (parentId: string) => {
    if (!inlineReplyContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/forum/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: inlineReplyContent,
          parentId: parentId,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "Error al enviar respuesta")
        return
      }

      setInlineReplyContent("")
      setReplyingToId(null)
      window.location.reload()
    } catch {
      alert("Error al enviar respuesta")
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelInlineReply = () => {
    setReplyingToId(null)
    setInlineReplyContent("")
  }

  const renderReplyItem = (reply: Reply, isNested: boolean = false) => {
    const tierBadge = getTierBadge(reply.tier)
    const isReplyingToThis = replyingToId === reply.id

    return (
      <div key={reply.id}>
        <div className={`p-3 md:p-4 ${isNested ? "pl-4 md:pl-8 border-l-2 border-[#00B1DE]/30" : ""}`}>
          {/* Reply Header - Mobile: Stack author info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href={`/foro/perfil/${reply.authorId}`}>
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden relative bg-gray-600 cursor-pointer hover:ring-2 hover:ring-[#00B1DE] transition-all flex-shrink-0">
                  {reply.authorImage ? (
                    <Image
                      src={reply.authorImage}
                      alt={reply.author}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs md:text-sm font-bold">
                      {reply.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
              <Link
                href={`/foro/perfil/${reply.authorId}`}
                className="font-montserrat text-white text-[14px] md:text-[16px] font-medium leading-[24px] hover:text-[#00B1DE] transition-colors"
              >
                {reply.author}
              </Link>
              {tierBadge && (
                <span
                  className="font-montserrat text-[10px] md:text-[12px] font-medium px-1.5 md:px-2 py-0.5"
                  style={{
                    color: tierBadge.textColor,
                    backgroundColor: tierBadge.bgColor,
                  }}
                >
                  {tierBadge.label}
                </span>
              )}
            </div>
            <span className="font-montserrat text-[#9CA3AF] text-[12px] md:text-[14px] font-normal">
              {reply.timeAgo}
            </span>
          </div>

          {/* Reply Content */}
          <div className="mb-3">
            <p className="font-montserrat text-white text-[13px] md:text-[14px] font-normal leading-[20px] whitespace-pre-wrap break-words">
              {reply.content}
            </p>
          </div>

          {/* Reply Actions */}
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            {/* Like Reply */}
            <button
              onClick={() => handleReplyLike(reply.id)}
              disabled={!userId || likingReplyId === reply.id}
              className={`flex items-center gap-1 transition-all ${
                !userId ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-70"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={reply.isLiked ? "#FA4860" : "none"}
                stroke={reply.isLiked ? "#FA4860" : "#4B5563"}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span
                className={`font-montserrat text-[12px] md:text-[14px] font-normal ${
                  reply.isLiked ? "text-[#FA4860]" : "text-white"
                }`}
              >
                {reply.likeCount}
              </span>
            </button>

            {/* Reply to comment */}
            {!isLocked && !isNested && (
              <button
                onClick={() => handleReplyTo(reply.id)}
                className={`flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity ${
                  isReplyingToThis ? "text-[#00B1DE]" : ""
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isReplyingToThis ? "#00B1DE" : "#4B5563"}
                  strokeWidth="2"
                >
                  <polyline points="9 17 4 12 9 7"></polyline>
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
                </svg>
                <span className={`font-montserrat text-[12px] md:text-[14px] font-normal ${isReplyingToThis ? "text-[#00B1DE]" : "text-white"}`}>
                  Responder
                </span>
              </button>
            )}

            {/* Quote */}
            {!isLocked && (
              <button
                onClick={() => handleQuoteReply(reply)}
                className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4B5563"
                  strokeWidth="2"
                >
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"></path>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"></path>
                </svg>
                <span className="font-montserrat text-white text-[12px] md:text-[14px] font-normal">
                  Citar
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Reply Form - appears inside the same block */}
        {isReplyingToThis && !isNested && (
          <div className="px-4 pb-4 border-t border-[#333]/50 mt-2 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00B1DE"
                strokeWidth="2"
              >
                <polyline points="9 17 4 12 9 7"></polyline>
                <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
              </svg>
              <span className="font-montserrat text-[#00B1DE] text-[13px]">
                Respondiendo a <strong>{reply.author}</strong>
              </span>
              <button
                type="button"
                onClick={cancelInlineReply}
                className="ml-auto text-white/60 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <textarea
              ref={inlineTextareaRef}
              value={inlineReplyContent}
              onChange={(e) => setInlineReplyContent(e.target.value)}
              placeholder={userId ? "Escribe tu respuesta..." : "Inicia sesión para responder..."}
              disabled={!userId}
              className="w-full bg-[rgba(0,0,0,0.3)] border border-[#444] text-white p-3 font-montserrat text-[14px] min-h-[80px] placeholder:text-white/40 focus:outline-none focus:border-[#00B1DE] disabled:opacity-50 disabled:cursor-not-allowed rounded"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={cancelInlineReply}
                className="text-white/60 px-4 py-2 font-montserrat text-[13px] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSubmitInlineReply(reply.id)}
                disabled={isSubmitting || !inlineReplyContent.trim() || !userId}
                className="bg-[#00B1DE] text-white px-4 py-2 font-montserrat text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00B1DE]/90 transition-colors cursor-pointer rounded"
              >
                {isSubmitting ? "Enviando..." : "Responder"}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Post Actions Bar */}
      <div className="bg-[rgba(75,85,99,0.21)] p-3 md:p-4 border-t border-[#333]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-6 flex-wrap">
            {/* Like Post */}
            <button
              onClick={handlePostLike}
              disabled={!userId || !!likingPostId}
              className={`flex items-center gap-1.5 md:gap-2 transition-all ${
                !userId ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-70"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isPostLiked ? "#FA4860" : "none"}
                stroke={isPostLiked ? "#FA4860" : "#4B5563"}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span
                className={`font-montserrat text-[12px] md:text-[14px] font-medium ${
                  isPostLiked ? "text-[#FA4860]" : "text-white"
                }`}
              >
                {postLikeCount} <span className="hidden sm:inline">{postLikeCount === 1 ? "Like" : "Likes"}</span>
              </span>
            </button>

            {/* Quote */}
            <button
              onClick={handleQuotePost}
              disabled={isLocked}
              className={`flex items-center gap-1.5 md:gap-2 transition-all ${
                isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-70"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4B5563"
                strokeWidth="2"
              >
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"></path>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"></path>
              </svg>
              <span className="font-montserrat text-white text-[12px] md:text-[14px] font-medium">Citar</span>
            </button>

            {/* Comments count */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4B5563"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span className="font-montserrat text-white text-[12px] md:text-[14px] font-medium">
                {replies.length} <span className="hidden sm:inline">Respuestas</span>
              </span>
            </div>
          </div>

          {/* Report */}
          <button className="flex items-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-70 transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4B5563"
              strokeWidth="2"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            <span className="font-montserrat text-[#4B5563] text-[12px] md:text-[14px] font-medium">Reportar</span>
          </button>
        </div>
        {!userId && (
          <p className="text-white/40 text-xs mt-2 font-montserrat">
            <Link href="/admin/login" className="text-[#00B1DE] hover:underline">Inicia sesión</Link> para dar like y participar
          </p>
        )}
      </div>

      <h3 className="font-montserrat text-white text-[16px] md:text-[18px] font-semibold leading-[28px] mt-6 md:mt-8 mb-3 md:mb-4">
        {replies.length} Comentarios
      </h3>

      {/* Grouped Comments */}
      {groupedReplies.length > 0 && (
        <div className="flex flex-col gap-4">
          {groupedReplies.map((group) => (
            <div key={group.parent.id} className="bg-[rgba(75,85,99,0.21)] rounded">
              {/* Parent comment */}
              {renderReplyItem(group.parent, false)}

              {/* Nested replies */}
              {group.children.length > 0 && (
                <div className="border-t border-[#333]/50">
                  {group.children.map((child) => renderReplyItem(child, true))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {replies.length === 0 && (
        <div className="bg-[rgba(75,85,99,0.21)] p-6 md:p-8 text-center rounded">
          <p className="text-white/60 font-montserrat text-[13px] md:text-base">
            No hay respuestas aún. ¡Sé el primero en comentar!
          </p>
        </div>
      )}

      {/* Main Reply Form - for new top-level comments */}
      {!isLocked ? (
        <form onSubmit={handleSubmitReply} className="mt-4 md:mt-6">
          <h4 className="font-montserrat text-white text-[14px] md:text-[16px] font-semibold mb-3 md:mb-4">
            {quotedAuthor ? "Responder con cita" : "Escribe un nuevo comentario"}
          </h4>

          {/* Quote Block - shows when quoting someone */}
          {quotedAuthor && quotedContent && (
            <div className="mb-3 md:mb-4 bg-[rgba(0,177,222,0.1)] border-l-4 border-[#00B1DE] rounded-r p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-montserrat text-[#00B1DE] text-[12px] md:text-[14px] font-medium">
                  Estás citando a <strong>{quotedAuthor}</strong>
                </span>
                <button
                  type="button"
                  onClick={cancelQuote}
                  className="text-white/60 hover:text-white transition-colors"
                  title="Cancelar cita"
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
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <p className="font-montserrat text-white/70 text-[12px] md:text-[13px] leading-[20px] italic break-words">
                &quot;{quotedContent}&quot;
              </p>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={
              userId
                ? quotedAuthor
                  ? "Escribe tu respuesta a la cita..."
                  : "Escribe tu comentario aquí..."
                : "Inicia sesión para comentar..."
            }
            disabled={!userId}
            className="w-full bg-[rgba(75,85,99,0.21)] border border-[#E5E7EB] text-white p-3 md:p-4 font-montserrat text-[13px] md:text-[14px] min-h-[100px] md:min-h-[120px] placeholder:text-white/40 focus:outline-none focus:border-[#00B1DE] disabled:opacity-50 disabled:cursor-not-allowed rounded"
            required
          />
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-3 md:mt-4">
            {quotedAuthor && (
              <button
                type="button"
                onClick={cancelQuote}
                className="text-white/60 hover:text-white transition-colors font-montserrat text-[13px] md:text-[14px] order-2 sm:order-1"
              >
                Cancelar cita
              </button>
            )}
            <div className={`${quotedAuthor ? "" : "sm:ml-auto"} order-1 sm:order-2`}>
              <button
                type="submit"
                disabled={isSubmitting || !replyContent.trim() || !userId}
                className="w-full sm:w-auto bg-[#00B1DE] text-white px-5 md:px-6 py-2.5 md:py-3 font-montserrat text-[13px] md:text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00B1DE]/90 transition-colors cursor-pointer rounded"
              >
                {isSubmitting ? "Enviando..." : quotedAuthor ? "Publicar Respuesta" : "Publicar Comentario"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-4 md:mt-6 bg-[rgba(75,85,99,0.21)] p-4 text-center rounded">
          <p className="text-white/60 font-montserrat text-[13px] md:text-base">
            Este tema está cerrado y no acepta nuevas respuestas.
          </p>
        </div>
      )}
    </>
  )
}
