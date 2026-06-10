"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Lock, Heart, ChevronDown } from "lucide-react"
import { VideoGrid } from "./video-grid"
import { useSubscription } from "@/hooks/use-subscription"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"

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

interface GalleryImage {
  src: string
  alt: string
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

interface VideoDetailLayoutProps {
  galleryImages: GalleryImage[]
  videoId: string
  videoSlug: string
  comments: Comment[]
  commentCount: number
  categoryIds: string[]
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

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K`
  return views.toString()
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full py-2 my-8" style={{ backgroundColor: "var(--sh-bg)" }}>
      <div className="flex items-center gap-4">
        <div className="flex-1" style={{ height: "var(--sh-line-height)", backgroundColor: "var(--sh-line-color)" }} />
        <h2
          className="whitespace-nowrap leading-6"
          style={{
            color: "var(--sh-text)",
            fontSize: "var(--sh-font-size)",
            fontWeight: "var(--sh-font-weight)" as React.CSSProperties["fontWeight"],
            fontFamily: "var(--global-font)",
            textTransform: "var(--sh-text-transform)" as React.CSSProperties["textTransform"],
            letterSpacing: "var(--sh-letter-spacing)",
          }}
        >
          {children}
        </h2>
        <div className="flex-1" style={{ height: "var(--sh-line-height)", backgroundColor: "var(--sh-line-color)" }} />
      </div>
    </div>
  )
}

export function VideoDetailLayout({
  galleryImages,
  videoId,
  videoSlug,
  comments: initialComments,
  commentCount,
  categoryIds,
}: VideoDetailLayoutProps) {
  const { data: session } = useSession()
  const { canComment, isAuthenticated, planName } = useSubscription()
  const [activeTab, setActiveTab] = useState<"gallery" | "comments">(
    galleryImages.length > 0 ? "gallery" : "comments"
  )
  const [commentFilter, setCommentFilter] = useState<"popular" | "new">("popular")
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [visibleVideoCount, setVisibleVideoCount] = useState(6)

  // Fetch related videos
  useEffect(() => {
    setLoadingVideos(true)
    fetch(
      `/api/videos?limit=12&excludeId=${videoId}${categoryIds.length > 0 ? `&categoryIds=${categoryIds.join(",")}` : ""}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.videos) {
          setRelatedVideos(
            data.videos.map(
              (v: {
                id: string
                slug: string
                title: string
                thumbnailUrl: string
                viewCount: number
                likeCount: number
                performers?: { performer: { name: string } }[]
              }) => ({
                id: v.id,
                slug: v.slug,
                title: v.title,
                subtitle: v.performers?.[0]?.performer?.name || "",
                views: formatViews(v.viewCount),
                likes: `${Math.min(99, Math.round((v.likeCount / Math.max(v.viewCount, 1)) * 100 + 80))}%`,
                imageUrl: v.thumbnailUrl || "/placeholder-video.jpg",
                isVerified: true,
              })
            )
          )
        }
      })
      .catch(console.error)
      .finally(() => setLoadingVideos(false))
  }, [videoId, categoryIds])

  const sortedComments = [...comments].sort((a, b) => {
    if (commentFilter === "popular") return b.likeCount - a.likeCount
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

  const displayedVideos = relatedVideos.slice(0, visibleVideoCount)

  return (
    <div className="w-full">
      {/* Content Tabs - uses admin sectionHeaders theme */}
      <div className="w-full py-2 my-8" style={{ backgroundColor: "var(--sh-bg)" }}>
        <div className="flex items-center gap-4">
          <div className="flex-1" style={{ height: "var(--sh-line-height)", backgroundColor: "var(--sh-line-color)" }} />
          <div className="flex items-center">
            {galleryImages.length > 0 && (
              <>
                <button
                  onClick={() => setActiveTab("gallery")}
                  className="whitespace-nowrap leading-6 px-3 py-1 transition-colors bg-transparent border-none cursor-pointer"
                  style={{
                    color: activeTab === "gallery" ? "var(--sh-text)" : "var(--text-muted)",
                    fontSize: "var(--sh-font-size)",
                    fontWeight: "var(--sh-font-weight)",
                    fontFamily: "var(--global-font)",
                    textTransform: "var(--sh-text-transform)" as React.CSSProperties["textTransform"],
                    letterSpacing: "var(--sh-letter-spacing)",
                  }}
                >
                  Gallery
                </button>
                <div
                  className="h-4 mx-2"
                  style={{ width: "var(--sh-line-height)", backgroundColor: "var(--sh-line-color)" }}
                />
              </>
            )}
            <button
              onClick={() => setActiveTab("comments")}
              className="whitespace-nowrap leading-6 px-3 py-1 transition-colors bg-transparent border-none cursor-pointer"
              style={{
                color: activeTab === "comments" ? "var(--sh-text)" : "var(--text-muted)",
                fontSize: "var(--sh-font-size)",
                fontWeight: "var(--sh-font-weight)",
                fontFamily: "var(--global-font)",
                textTransform: "var(--sh-text-transform)" as React.CSSProperties["textTransform"],
                letterSpacing: "var(--sh-letter-spacing)",
              }}
            >
              Comments
            </button>
          </div>
          <div className="flex-1" style={{ height: "var(--sh-line-height)", backgroundColor: "var(--sh-line-color)" }} />
        </div>
      </div>

      {/* Gallery Tab - CAROUSEL like dev_test2 */}
      <div className={activeTab === "gallery" ? "block" : "hidden"}>
        {galleryImages.length > 0 && (
          <div className="w-full px-12">
            <Carousel
              opts={{
                align: "start",
                loop: galleryImages.length > 3,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {galleryImages.map((image, index) => (
                  <CarouselItem key={index} className="basis-full md:basis-1/3 lg:basis-1/4 pl-4">
                    <div className="relative aspect-video cursor-pointer group overflow-hidden">
                      <Image
                        src={image.src || "/placeholder.svg"}
                        alt={image.alt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious
                className="ml-2"
                style={{
                  color: "var(--carousel-arrow-icon)",
                  backgroundColor: "var(--carousel-arrow-bg)",
                  borderColor: "var(--carousel-arrow-border)",
                  borderWidth: "var(--carousel-arrow-border-width)",
                  width: "var(--carousel-arrow-size)",
                  height: "var(--carousel-arrow-size)",
                  borderRadius: "var(--carousel-arrow-radius)",
                }}
              />
              <CarouselNext
                className="mr-2"
                style={{
                  color: "var(--carousel-arrow-icon)",
                  backgroundColor: "var(--carousel-arrow-bg)",
                  borderColor: "var(--carousel-arrow-border)",
                  borderWidth: "var(--carousel-arrow-border-width)",
                  width: "var(--carousel-arrow-size)",
                  height: "var(--carousel-arrow-size)",
                  borderRadius: "var(--carousel-arrow-radius)",
                }}
              />
            </Carousel>
          </div>
        )}
      </div>

      {/* Comments Tab */}
      <div className={activeTab === "comments" ? "block" : "hidden"}>
        <div className="space-y-6" style={{ fontFamily: "var(--global-font)" }}>
          {/* Header: Comment Count + Sort Buttons */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Comments ({comments.length})
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setCommentFilter("popular")}
                className="cursor-pointer px-3 py-1 text-xs transition-colors border-none"
                style={{
                  backgroundColor: commentFilter === "popular"
                    ? "color-mix(in srgb, var(--accent-color) 20%, transparent)"
                    : "transparent",
                  color: commentFilter === "popular" ? "var(--accent-color)" : "var(--text-muted)",
                  fontFamily: "var(--global-font)",
                }}
              >
                Popular
              </button>
              <button
                onClick={() => setCommentFilter("new")}
                className="cursor-pointer px-3 py-1 text-xs transition-colors border-none"
                style={{
                  backgroundColor: commentFilter === "new"
                    ? "color-mix(in srgb, var(--accent-color) 20%, transparent)"
                    : "transparent",
                  color: commentFilter === "new" ? "var(--accent-color)" : "var(--text-muted)",
                  fontFamily: "var(--global-font)",
                }}
              >
                New
              </button>
            </div>
          </div>

          {/* Comment Input - uses admin form/button theme vars */}
          {isAuthenticated && canComment ? (
            <div>
              <textarea
                placeholder="Write your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full min-h-[80px] p-4 resize-none outline-none text-sm"
                style={{
                  backgroundColor: "var(--form-input-bg)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "var(--form-input-border)",
                  color: "var(--form-input-text)",
                  fontFamily: "var(--global-font)",
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                  className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          ) : isAuthenticated && !canComment ? (
            <div
              className="w-full p-6 flex flex-col items-center gap-4"
              style={{
                background: "color-mix(in srgb, var(--surface-bg) 50%, transparent)",
                borderLeft: "4px solid var(--accent-color)",
              }}
            >
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6" style={{ color: "var(--accent-color)" }} />
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Comments require a Gold subscription or higher
                </p>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Your current plan: <span className="font-medium" style={{ color: "var(--brand-color)" }}>{planName}</span>
              </p>
              <Link
                href="/suscripciones"
                className="btn-primary inline-block hover:opacity-80 transition-colors"
              >
                Upgrade Subscription
              </Link>
            </div>
          ) : (
            <div
              className="w-full p-6 text-center"
              style={{ background: "color-mix(in srgb, var(--surface-bg) 50%, transparent)" }}
            >
              <p style={{ color: "var(--text-muted)" }}>
                <Link href="/?login=true" className="hover:underline" style={{ color: "var(--link-color)" }}>
                  Log in
                </Link>{" "}
                to leave a comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {sortedComments.length === 0 ? (
              <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                No comments yet. Be the first to comment!
              </div>
            ) : (
              sortedComments.map((comment) => (
                <div key={comment.id} className="space-y-0">
                  {/* Main comment */}
                  <div className="flex gap-3">
                    <img
                      src={comment.author.image || "/placeholder.svg?height=40&width=40"}
                      alt={comment.author.name}
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--link-color)" }}>
                          {comment.author.name}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: "color-mix(in srgb, var(--text-primary) 80%, transparent)" }}>
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <button className="flex items-center gap-1 text-xs border-none bg-transparent cursor-pointer" style={{ color: "var(--text-muted)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {comment.likeCount}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies - with border-l like dev_test2 */}
                  {comment.replies.length > 0 && (
                    <div
                      className="pl-8 ml-5 mt-3 space-y-4"
                      style={{ borderLeft: "2px solid var(--border-color, #333)" }}
                    >
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <img
                            src={reply.author.image || "/placeholder.svg?height=32&width=32"}
                            alt={reply.author.name}
                            className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: "var(--link-color)" }}>
                                {reply.author.name}
                              </span>
                              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {formatTimeAgo(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm mt-1" style={{ color: "color-mix(in srgb, var(--text-primary) 80%, transparent)" }}>
                              {reply.content}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <button className="flex items-center gap-1 text-xs border-none bg-transparent cursor-pointer" style={{ color: "var(--text-muted)" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                {reply.likeCount}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Related Videos */}
      <section className="mt-16 mb-8">
        <SectionTitle>Related Videos</SectionTitle>
        {loadingVideos ? (
          <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
            Loading videos...
          </div>
        ) : displayedVideos.length > 0 ? (
          <>
            <VideoGrid videos={displayedVideos} columns={3} />
            {relatedVideos.length > visibleVideoCount && (
              <div className="text-center pt-6">
                <button
                  onClick={() => setVisibleVideoCount(relatedVideos.length)}
                  className="btn-secondary inline-flex items-center gap-2 cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                  See more
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
            No related videos
          </div>
        )}
      </section>
    </div>
  )
}
