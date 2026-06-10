"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { VideoGrid } from "./video-grid"
import { useSubscription } from "@/hooks/use-subscription"
import { ReportModal } from "@/components/report-modal"

interface Author {
  id: string
  name: string
  image: string | null
  tier?: string
}

interface Reply {
  id: string
  content: string
  likeCount: number
  createdAt: string
  author: Author
}

interface Comment {
  id: string
  content: string
  likeCount: number
  createdAt: string
  author: Author
  replies: Reply[]
}

interface RelatedContentTabsProps {
  videoId: string
  videoSlug: string
  comments: Comment[]
  commentCount: number
  categoryIds: string[]
}

interface RelatedVideo {
  id: string
  slug: string
  title: string
  subtitle: string
  views: string
  likes: string
  imageUrl: string
  isVerified: boolean
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "a few seconds ago"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`
}

export function RelatedContentTabs({
  videoId,
  videoSlug,
  comments: initialComments,
  commentCount,
  categoryIds,
}: RelatedContentTabsProps) {
  const { data: session } = useSession()
  const { canComment, isAuthenticated, planName } = useSubscription()
  const [activeTab, setActiveTab] = useState<"videos" | "comments">("videos")
  const [commentFilter, setCommentFilter] = useState<"popular" | "new">("popular")
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [reportTarget, setReportTarget] = useState<string | null>(null)

  // Fetch related videos when tab is activated
  useEffect(() => {
    if (activeTab === "videos" && relatedVideos.length === 0) {
      setLoadingVideos(true)
      // Fetch videos from same categories
      fetch(`/api/videos?limit=6&excludeId=${videoId}${categoryIds.length > 0 ? `&categoryIds=${categoryIds.join(",")}` : ""}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.videos) {
            setRelatedVideos(
              data.videos.map((v: { id: string; slug: string; title: string; thumbnailUrl: string; viewCount: number; likeCount: number; performers?: { performer: { name: string } }[] }) => ({
                id: v.id,
                slug: v.slug,
                title: v.title,
                subtitle: v.performers?.[0]?.performer?.name || "",
                views: formatViews(v.viewCount),
                likes: `${Math.min(99, Math.round((v.likeCount / Math.max(v.viewCount, 1)) * 100 + 80))}%`,
                imageUrl: v.thumbnailUrl || "/placeholder-video.jpg",
                isVerified: true,
              }))
            )
          }
        })
        .catch(console.error)
        .finally(() => setLoadingVideos(false))
    }
  }, [activeTab, videoId, categoryIds, relatedVideos.length])

  // Sort comments based on filter
  const sortedComments = [...comments].sort((a, b) => {
    if (commentFilter === "popular") {
      return b.likeCount - a.likeCount
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !session?.user || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/videos/${videoSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments([data.comment, ...comments])
        setNewComment("")
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-8 mb-8">
        <button
          onClick={() => setActiveTab("videos")}
          className="cursor-pointer transition-colors"
          style={{
            color: activeTab === "videos" ? "var(--brand-color)" : "var(--text-primary)",
            fontFamily: "var(--global-font)",
            fontSize: "22px",
            fontWeight: 700,
            lineHeight: "48px",
          }}
        >
          Related videos
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className="cursor-pointer transition-colors"
          style={{
            color: activeTab === "comments" ? "var(--brand-color)" : "var(--text-primary)",
            fontFamily: "var(--global-font)",
            fontSize: "22px",
            fontWeight: 700,
            lineHeight: "48px",
          }}
        >
          Comments
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "videos" && (
          <div>
            {loadingVideos ? (
              <div className="text-white text-center py-8">Loading videos...</div>
            ) : relatedVideos.length > 0 ? (
              <VideoGrid videos={relatedVideos} />
            ) : (
              <div className="text-white/60 text-center py-8">No related videos</div>
            )}
          </div>
        )}
        {activeTab === "comments" && (
          <div className="w-full" style={{ fontFamily: "var(--global-font)" }}>
            {/* Comment Count */}
            <div className="flex items-center gap-2 mb-8">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
                  stroke="var(--text-secondary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontFamily: "var(--global-font)",
                  fontSize: "20px",
                  fontWeight: 500,
                }}
              >
                {commentCount} Comments
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-8 mb-4">
              <button
                onClick={() => setCommentFilter("popular")}
                className="cursor-pointer pb-2 relative"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--global-font)",
                  fontSize: "16px",
                  fontWeight: 500,
                  lineHeight: "24px",
                }}
              >
                Popular
                {commentFilter === "popular" && (
                  <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: "3px",
                      background: "var(--brand-color)",
                    }}
                  />
                )}
              </button>
              <button
                onClick={() => setCommentFilter("new")}
                className="cursor-pointer pb-2 relative"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--global-font)",
                  fontSize: "16px",
                  fontWeight: 500,
                  lineHeight: "24px",
                }}
              >
                New
                {commentFilter === "new" && (
                  <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: "3px",
                      background: "var(--brand-color)",
                    }}
                  />
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-white/10 mb-8" />

            {/* Comments List */}
            <div className="space-y-8">
              {sortedComments.length === 0 ? (
                <div className="text-white/60 text-center py-8">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                sortedComments.map((comment) => (
                  <div key={comment.id} className="space-y-4">
                    {/* Main Comment */}
                    <div className="flex gap-4">
                      <img
                        src={comment.author.image || "/placeholder.svg?height=60&width=60"}
                        alt={comment.author.name}
                        className="w-[60px] h-[60px] rounded-full flex-shrink-0 object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            style={{
                              color: "var(--brand-color)",
                              fontFamily: "var(--global-font)",
                              fontSize: "16px",
                              fontWeight: 600,
                              lineHeight: "24px",
                            }}
                          >
                            {comment.author.name}
                          </h4>
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontFamily: "var(--global-font)",
                              fontSize: "12px",
                            }}
                          >
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "var(--text-secondary)",
                            fontFamily: "var(--global-font)",
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "21px",
                            marginBottom: "8px",
                          }}
                        >
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                                stroke="var(--accent-color)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span
                              style={{
                                color: "var(--accent-color)",
                                fontFamily: "var(--global-font)",
                                fontSize: "14px",
                                fontWeight: 500,
                              }}
                            >
                              {comment.likeCount}
                            </span>
                          </div>
                          {session?.user && (
                            <button
                              onClick={() => setReportTarget(comment.id)}
                              className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="var(--text-muted, #4B5563)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="4" y1="22" x2="4" y2="15" stroke="var(--text-muted, #4B5563)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span style={{ color: "var(--text-muted)", fontFamily: "var(--global-font)", fontSize: "12px" }}>Report</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-4 ml-16">
                        <img
                          src={reply.author.image || "/placeholder.svg?height=50&width=50"}
                          alt={reply.author.name}
                          className="w-[50px] h-[50px] rounded-full flex-shrink-0 object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              style={{
                                color: "var(--brand-color)",
                                fontFamily: "var(--global-font)",
                                fontSize: "14px",
                                fontWeight: 600,
                              }}
                            >
                              {reply.author.name}
                            </span>
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontFamily: "var(--global-font)",
                                fontSize: "12px",
                                fontWeight: 400,
                              }}
                            >
                              · {formatTimeAgo(reply.createdAt)}
                            </span>
                          </div>
                          <p
                            style={{
                              color: "var(--text-secondary)",
                              fontFamily: "var(--global-font)",
                              fontSize: "14px",
                              fontWeight: 400,
                              lineHeight: "21px",
                              marginBottom: "8px",
                            }}
                          >
                            {reply.content}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                                    stroke="var(--accent-color)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span
                                  style={{
                                    color: "var(--accent-color)",
                                    fontFamily: "var(--global-font)",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                  }}
                                >
                                  {reply.likeCount}
                                </span>
                              </div>
                              {session?.user && (
                                <button
                                  onClick={() => setReportTarget(reply.id)}
                                  className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="var(--text-muted, #4B5563)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="4" y1="22" x2="4" y2="15" stroke="var(--text-muted, #4B5563)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <span style={{ color: "var(--text-muted)", fontFamily: "var(--global-font)", fontSize: "11px" }}>Report</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Comment Input Section */}
            {isAuthenticated && canComment ? (
              <>
                <div
                  className="w-full p-6 flex items-center gap-4 mt-8"
                  style={{
                    borderLeft: "4px solid var(--brand-color)",
                    background: "rgba(107, 114, 128, 0.22)",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <img
                    src={session?.user?.image || "/placeholder.svg?height=60&width=60"}
                    alt="Your avatar"
                    className="w-[60px] h-[60px] rounded-full flex-shrink-0 object-cover"
                  />
                  <input
                    type="text"
                    placeholder="Write your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmitComment()
                      }
                    }}
                    className="flex-1 bg-transparent outline-none"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "var(--global-font)",
                      fontSize: "16px",
                      fontWeight: 400,
                    }}
                  />
                </div>

                {/* Enviar button */}
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                  className="cursor-pointer mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "var(--brand-color)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--global-font)",
                    fontSize: "18px",
                    fontWeight: 600,
                    padding: "12px 48px",
                    border: "none",
                  }}
                >
                  {submitting ? "Sending..." : "Send"}
                </button>
              </>
            ) : isAuthenticated && !canComment ? (
              <div
                className="w-full p-6 mt-8 flex flex-col items-center gap-4"
                style={{
                  background: "rgba(107, 114, 128, 0.22)",
                  borderLeft: "4px solid var(--accent-color)",
                }}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6" style={{ color: "var(--accent-color)" }} />
                  <p className="font-montserrat text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    Comments require a Gold subscription or higher
                  </p>
                </div>
                <p className="font-montserrat text-sm" style={{ color: "var(--text-muted)" }}>
                  Your current plan: <span className="font-medium" style={{ color: "var(--brand-color)" }}>{planName}</span>
                </p>
                <Link
                  href="/suscripciones"
                  className="mt-2 px-6 py-3 font-montserrat font-semibold hover:opacity-80 transition-colors"
                  style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}
                >
                  Upgrade Subscription
                </Link>
              </div>
            ) : (
              <div
                className="w-full p-6 text-center mt-8"
                style={{
                  background: "rgba(107, 114, 128, 0.22)",
                }}
              >
                <p className="font-montserrat" style={{ color: "var(--text-muted)" }}>
                  <Link href="/?login=true" className="hover:underline" style={{ color: "var(--accent-color)" }}>
                    Log in
                  </Link>{" "}
                  to leave a comment
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Report Modal */}
      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        itemType="VIDEO_COMMENT"
        itemId={reportTarget || ""}
      />
    </div>
  )
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K`
  return views.toString()
}
