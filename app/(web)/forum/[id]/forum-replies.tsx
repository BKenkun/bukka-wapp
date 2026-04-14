"use client"

import { useState, useRef, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ReportModal } from "@/components/report-modal"

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
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [inlineReplyContent, setInlineReplyContent] = useState("")
  const [quotedAuthor, setQuotedAuthor] = useState<string | null>(null)
  const [quotedContent, setQuotedContent] = useState<string | null>(null)
  const [reportTarget, setReportTarget] = useState<{ type: "FORUM_POST" | "FORUM_REPLY"; id: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inlineTextareaRef = useRef<HTMLTextAreaElement>(null)

  const groupedReplies = useMemo(() => {
    const topLevel: Reply[] = []
    const childrenMap: Record<string, Reply[]> = {}
    replies.forEach((reply) => {
      if (!reply.parentId) {
        topLevel.push(reply)
      } else {
        if (!childrenMap[reply.parentId]) childrenMap[reply.parentId] = []
        childrenMap[reply.parentId].push(reply)
      }
    })
    return topLevel.map((parent) => ({ parent, children: childrenMap[parent.id] || [] }))
  }, [replies])

  const handlePostLike = async () => {
    if (!userId || likingPostId) return
    setLikingPostId(postId)
    try {
      const res = await fetch(`/api/forum/posts/${postId}/like`, { method: "POST" })
      if (res.ok) { const data = await res.json(); setPostLikeCount(data.likeCount); setIsPostLiked(data.liked) }
    } catch (error) { console.error("Error toggling post like:", error) } finally { setLikingPostId(null) }
  }

  const handleReplyLike = async (replyId: string) => {
    if (!userId || likingReplyId) return
    setLikingReplyId(replyId)
    try {
      const res = await fetch(`/api/forum/replies/${replyId}/like`, { method: "POST" })
      if (res.ok) { const data = await res.json(); setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, likeCount: data.likeCount, isLiked: data.liked } : r)) }
    } catch (error) { console.error("Error toggling reply like:", error) } finally { setLikingReplyId(null) }
  }

  const handleQuotePost = () => {
    setQuotedAuthor(postAuthor)
    setQuotedContent(postContent.substring(0, 300) + (postContent.length > 300 ? "..." : ""))
    setReplyContent(""); setReplyingToId(null)
    textareaRef.current?.focus(); textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const handleQuoteReply = (reply: Reply) => {
    setQuotedAuthor(reply.author)
    setQuotedContent(reply.content.substring(0, 300) + (reply.content.length > 300 ? "..." : ""))
    setReplyContent(""); setReplyingToId(null)
    textareaRef.current?.focus(); textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const cancelQuote = () => { setQuotedAuthor(null); setQuotedContent(null) }

  const handleReplyTo = (replyId: string) => {
    setReplyingToId(replyId); setInlineReplyContent("")
    setTimeout(() => { inlineTextareaRef.current?.focus() }, 100)
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      let finalContent = replyContent
      if (quotedAuthor && quotedContent) finalContent = `> **${quotedAuthor}** wrote:\n> ${quotedContent}\n\n${replyContent}`
      const res = await fetch(`/api/forum/posts/${postId}/replies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: finalContent, parentId: null }) })
      if (!res.ok) { const error = await res.json(); alert(error.error || "Error submitting reply"); return }
      setReplyContent(""); setQuotedAuthor(null); setQuotedContent(null); window.location.reload()
    } catch { alert("Error submitting reply") } finally { setIsSubmitting(false) }
  }

  const handleSubmitInlineReply = async (parentId: string) => {
    if (!inlineReplyContent.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/forum/posts/${postId}/replies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: inlineReplyContent, parentId }) })
      if (!res.ok) { const error = await res.json(); alert(error.error || "Error submitting reply"); return }
      setInlineReplyContent(""); setReplyingToId(null); window.location.reload()
    } catch { alert("Error submitting reply") } finally { setIsSubmitting(false) }
  }

  const cancelInlineReply = () => { setReplyingToId(null); setInlineReplyContent("") }

  const renderReplyItem = (reply: Reply, isNested: boolean = false) => {
    const tierBadge = getTierBadge(reply.tier)
    const isReplyingToThis = replyingToId === reply.id

    return (
      <div key={reply.id}>
        <div className={`p-3 md:p-4 ${isNested ? "pl-4 md:pl-8" : ""}`} style={isNested ? { borderLeft: "2px solid color-mix(in srgb, var(--accent-color) 30%, transparent)" } : undefined}>
          {/* Reply Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href={`/foro/perfil/${reply.authorId}`}>
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden relative cursor-pointer transition-all flex-shrink-0" style={{ backgroundColor: "var(--surface-bg)" }}>
                  {reply.authorImage ? (
                    <Image src={reply.authorImage} alt={reply.author} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs md:text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {reply.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
              <Link href={`/foro/perfil/${reply.authorId}`} className="font-montserrat text-[14px] md:text-[16px] font-medium leading-[24px] transition-colors" style={{ color: "var(--text-primary)" }}>
                {reply.author}
              </Link>
              {tierBadge && (
                <span className="font-montserrat text-[10px] md:text-[12px] font-medium px-1.5 md:px-2 py-0.5" style={{ color: tierBadge.textColor, backgroundColor: tierBadge.bgColor }}>
                  {tierBadge.label}
                </span>
              )}
            </div>
            <span className="font-montserrat text-[12px] md:text-[14px] font-normal" style={{ color: "var(--text-muted)" }}>{reply.timeAgo}</span>
          </div>

          {/* Reply Content */}
          <div className="mb-3">
            <p className="font-montserrat text-[13px] md:text-[14px] font-normal leading-[20px] whitespace-pre-wrap break-words" style={{ color: "var(--text-primary)" }}>
              {reply.content}
            </p>
          </div>

          {/* Reply Actions */}
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <button onClick={() => handleReplyLike(reply.id)} disabled={!userId || likingReplyId === reply.id} className={`flex items-center gap-1 transition-all ${!userId ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-70"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={reply.isLiked ? "var(--brand-color)" : "none"} stroke={reply.isLiked ? "var(--brand-color)" : "var(--text-muted)"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span className="font-montserrat text-[12px] md:text-[14px] font-normal" style={{ color: reply.isLiked ? "var(--brand-color)" : "var(--text-primary)" }}>{reply.likeCount}</span>
            </button>

            {!isLocked && !isNested && (
              <button onClick={() => handleReplyTo(reply.id)} className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isReplyingToThis ? "var(--accent-color)" : "var(--text-muted)"} strokeWidth="2">
                  <polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
                </svg>
                <span className="font-montserrat text-[12px] md:text-[14px] font-normal" style={{ color: isReplyingToThis ? "var(--accent-color)" : "var(--text-primary)" }}>Reply</span>
              </button>
            )}

            {!isLocked && (
              <button onClick={() => handleQuoteReply(reply)} className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"></path>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"></path>
                </svg>
                <span className="font-montserrat text-[12px] md:text-[14px] font-normal" style={{ color: "var(--text-primary)" }}>Quote</span>
              </button>
            )}

            {userId && (
              <button onClick={() => setReportTarget({ type: "FORUM_REPLY", id: reply.id })} className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                <span className="font-montserrat text-[12px] md:text-[14px] font-normal" style={{ color: "var(--text-muted)" }}>Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Reply Form */}
        {isReplyingToThis && !isNested && (
          <div className="px-4 pb-4 mt-2 pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2">
                <polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
              </svg>
              <span className="font-montserrat text-[13px]" style={{ color: "var(--accent-color)" }}>
                Replying to <strong>{reply.author}</strong>
              </span>
              <button type="button" onClick={cancelInlineReply} className="ml-auto hover:opacity-80 transition-colors" style={{ color: "var(--text-muted)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <textarea
              ref={inlineTextareaRef}
              value={inlineReplyContent}
              onChange={(e) => setInlineReplyContent(e.target.value)}
              placeholder={userId ? "Write your reply..." : "Sign in to reply..."}
              disabled={!userId}
              className="w-full p-3 font-montserrat text-[14px] min-h-[80px] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={cancelInlineReply} className="px-4 py-2 font-montserrat text-[13px] transition-colors" style={{ color: "var(--text-muted)" }}>Cancel</button>
              <button type="button" onClick={() => handleSubmitInlineReply(reply.id)} disabled={isSubmitting || !inlineReplyContent.trim() || !userId} className="px-4 py-2 font-montserrat text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer" style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}>
                {isSubmitting ? "Submitting..." : "Reply"}
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
      <div className="p-3 md:p-4" style={{ backgroundColor: "var(--surface-bg)", borderTop: "1px solid var(--border-color)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-6 flex-wrap">
            <button onClick={handlePostLike} disabled={!userId || !!likingPostId} className={`flex items-center gap-1.5 md:gap-2 transition-all ${!userId ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-70"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isPostLiked ? "var(--brand-color)" : "none"} stroke={isPostLiked ? "var(--brand-color)" : "var(--text-muted)"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span className="font-montserrat text-[12px] md:text-[14px] font-medium" style={{ color: isPostLiked ? "var(--brand-color)" : "var(--text-primary)" }}>
                {postLikeCount} <span className="hidden sm:inline">{postLikeCount === 1 ? "Like" : "Likes"}</span>
              </span>
            </button>

            <button onClick={handleQuotePost} disabled={isLocked} className={`flex items-center gap-1.5 md:gap-2 transition-all ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-70"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"></path>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"></path>
              </svg>
              <span className="font-montserrat text-[12px] md:text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>Quote</span>
            </button>

            <div className="flex items-center gap-1.5 md:gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span className="font-montserrat text-[12px] md:text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
                {replies.length} <span className="hidden sm:inline">Replies</span>
              </span>
            </div>
          </div>

          {userId && (
            <button onClick={() => setReportTarget({ type: "FORUM_POST", id: postId })} className="flex items-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-70 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
              <span className="font-montserrat text-[12px] md:text-[14px] font-medium" style={{ color: "var(--text-muted)" }}>Report</span>
            </button>
          )}
        </div>
        {!userId && (
          <p className="text-xs mt-2 font-montserrat" style={{ color: "var(--text-muted)" }}>
            <Link href="/?login=true" className="hover:underline" style={{ color: "var(--accent-color)" }}>Sign in</Link> to like and participate
          </p>
        )}
      </div>

      <h3 className="font-montserrat text-[16px] md:text-[18px] font-semibold leading-[28px] mt-6 md:mt-8 mb-3 md:mb-4" style={{ color: "var(--text-primary)" }}>
        {replies.length} Comments
      </h3>

      {groupedReplies.length > 0 && (
        <div className="flex flex-col gap-4">
          {groupedReplies.map((group) => (
            <div key={group.parent.id} style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)" }}>
              {renderReplyItem(group.parent, false)}
              {group.children.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border-color)" }}>
                  {group.children.map((child) => renderReplyItem(child, true))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {replies.length === 0 && (
        <div className="p-6 md:p-8 text-center" style={{ backgroundColor: "var(--surface-bg)" }}>
          <p className="font-montserrat text-[13px] md:text-base" style={{ color: "var(--text-muted)" }}>
            No replies yet. Be the first to comment!
          </p>
        </div>
      )}

      {!isLocked ? (
        <form onSubmit={handleSubmitReply} className="mt-4 md:mt-6">
          <h4 className="font-montserrat text-[14px] md:text-[16px] font-semibold mb-3 md:mb-4" style={{ color: "var(--text-primary)" }}>
            {quotedAuthor ? "Reply with quote" : "Write a new comment"}
          </h4>

          {quotedAuthor && quotedContent && (
            <div className="mb-3 md:mb-4 p-3 md:p-4" style={{ backgroundColor: "color-mix(in srgb, var(--accent-color) 10%, transparent)", borderLeft: "4px solid var(--accent-color)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-montserrat text-[12px] md:text-[14px] font-medium" style={{ color: "var(--accent-color)" }}>
                  Quoting <strong>{quotedAuthor}</strong>
                </span>
                <button type="button" onClick={cancelQuote} className="hover:opacity-80 transition-colors" style={{ color: "var(--text-muted)" }} title="Cancel quote">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <p className="font-montserrat text-[12px] md:text-[13px] leading-[20px] italic break-words" style={{ color: "var(--text-secondary)" }}>
                &quot;{quotedContent}&quot;
              </p>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={userId ? (quotedAuthor ? "Write your reply to the quote..." : "Write your comment here...") : "Sign in to comment..."}
            disabled={!userId}
            className="w-full p-3 md:p-4 font-montserrat text-[13px] md:text-[14px] min-h-[100px] md:min-h-[120px] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
            required
          />
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-3 md:mt-4">
            {quotedAuthor && (
              <button type="button" onClick={cancelQuote} className="transition-colors font-montserrat text-[13px] md:text-[14px] order-2 sm:order-1" style={{ color: "var(--text-muted)" }}>Cancel quote</button>
            )}
            <div className={`${quotedAuthor ? "" : "sm:ml-auto"} order-1 sm:order-2`}>
              <button type="submit" disabled={isSubmitting || !replyContent.trim() || !userId} className="w-full sm:w-auto px-5 md:px-6 py-2.5 md:py-3 font-montserrat text-[13px] md:text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer" style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}>
                {isSubmitting ? "Submitting..." : quotedAuthor ? "Post Reply" : "Post Comment"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-4 md:mt-6 p-4 text-center" style={{ backgroundColor: "var(--surface-bg)" }}>
          <p className="font-montserrat text-[13px] md:text-base" style={{ color: "var(--text-muted)" }}>
            This topic is closed and no longer accepting replies.
          </p>
        </div>
      )}

      <ReportModal isOpen={!!reportTarget} onClose={() => setReportTarget(null)} itemType={reportTarget?.type || "FORUM_POST"} itemId={reportTarget?.id || ""} />
    </>
  )
}
