import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getUserPlan, canUserAccessForum } from "@/lib/subscription-guard"
import { ForumReplies } from "./forum-replies"
import { ForumAccessDenied } from "../forum-access-denied"
import { PollWidget } from "@/components/forum/poll-widget"

interface ForoTopicPageProps {
  params: Promise<{ id: string }>
}

// Helper to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "a few seconds ago"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`
}

export async function generateMetadata({ params }: ForoTopicPageProps) {
  const { id } = await params
  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: { title: true, content: true },
  })

  if (!post) return { title: "Topic not found" }

  return {
    title: post.title,
    description: post.content.substring(0, 160),
  }
}

export default async function ForoTopicPage({ params }: ForoTopicPageProps) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id || null

  // Check forum access
  const userPlan = userId ? await getUserPlan(userId) : null
  if (!canUserAccessForum(userPlan)) {
    return (
      <ForumAccessDenied
        isLoggedIn={!!session?.user}
        currentPlanName={userPlan?.name}
      />
    )
  }

  // Fetch post with author, category, and replies
  const [post, categories, stats] = await Promise.all([
    prisma.forumPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, SubscriptionPlan: { select: { name: true } } } },
        ForumCategory: { select: { id: true, slug: true, name: true } },
        poll: {
          include: {
            options: {
              orderBy: { order: "asc" },
              include: {
                _count: { select: { votes: true } },
                votes: { where: { userId: userId ?? "__none__" }, select: { id: true } },
              },
            },
          },
        },
        ForumReply: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            likeCount: true,
            createdAt: true,
            parentId: true,
            user: { select: { id: true, name: true, image: true, SubscriptionPlan: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.forumCategory.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { ForumPost: true } } },
    }),
    Promise.all([
      prisma.forumPost.count(),
      prisma.user.count({ where: { ForumPost: { some: {} } } }),
      prisma.forumPost.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]),
  ])

  if (!post) {
    notFound()
  }

  // Increment view count and get user likes in parallel
  const [, postLike, replyLikes] = await Promise.all([
    prisma.forumPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }),
    userId
      ? prisma.forumLike.findUnique({
          where: { userId_postId: { userId, postId: id } },
        })
      : null,
    userId
      ? prisma.forumLike.findMany({
          where: {
            userId,
            replyId: { in: post.ForumReply.map((r) => r.id) },
          },
        })
      : [],
  ])

  const isPostLiked = !!postLike
  const likedReplyIds = new Set(replyLikes?.map((l) => l.replyId) || [])

  const [totalTopics, activeUsers, newToday] = stats

  return (
    <div className="flex-1 flex flex-col font-sans" style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}>
      <div className="px-4 md:px-8 pt-24 md:pt-28">
        <h1 className="font-montserrat text-[24px] md:text-[30px] font-bold leading-[32px] md:leading-[36px]" style={{ color: "var(--text-primary)" }}>Forum</h1>
      </div>

      {/* Mobile: Back Button */}
      <div className="lg:hidden px-4 md:px-8 pt-4">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 hover:opacity-80 transition-colors font-montserrat text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Forum
        </Link>
      </div>

      <div className="flex flex-1 px-4 md:px-8 py-6 lg:py-12 gap-8">
        {/* Sidebar - Categories (hidden on mobile) */}
        <div className="w-[280px] flex-shrink-0 hidden lg:block">
          <Link href="/forum/nuevo">
            <button
              className="w-full font-montserrat text-[16px] font-medium text-center mb-6 flex items-center justify-center gap-2"
              style={{ padding: "14px 52px", backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M7.5 1C7.5 0.446875 7.05312 0 6.5 0C5.94688 0 5.5 0.446875 5.5 1V5.5H1C0.446875 5.5 0 5.94688 0 6.5C0 7.05312 0.446875 7.5 1 7.5H5.5V12C5.5 12.5531 5.94688 13 6.5 13C7.05312 13 7.5 12.5531 7.5 12V7.5H12C12.5531 7.5 13 7.05312 13 6.5C13 5.94688 12.5531 5.5 12 5.5H7.5V1Z"
                  fill="currentColor"
                />
              </svg>
              New Topic
            </button>
          </Link>

          <div className="p-6" style={{ border: "1px solid var(--border-color)" }}>
            <h2 className="font-montserrat text-[18px] font-semibold leading-normal mb-6" style={{ color: "var(--text-primary)" }}>Categories</h2>
            <div className="flex flex-col gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/foro?categoria=${category.slug}`}
                  className="flex items-center justify-between p-3 cursor-pointer transition-colors"
                  style={{ backgroundColor: post.ForumCategory.id === category.id ? "color-mix(in srgb, var(--brand-color) 27%, transparent)" : "transparent" }}
                >
                  <span className="font-montserrat text-[16px] font-medium leading-[24px]" style={{ color: "var(--text-primary)" }}>
                    {category.name}
                  </span>
                  <span
                    className="font-montserrat text-[12px] font-normal px-2 py-1 flex items-center justify-end"
                    style={{ padding: "4px 8px", backgroundColor: "var(--brand-color)", color: "#FFFFFF" }}
                  >
                    {category._count.ForumPost}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-6 mt-6" style={{ border: "1px solid var(--border-color)" }}>
            <h2 className="font-montserrat text-[18px] font-semibold leading-normal mb-6" style={{ color: "var(--text-primary)" }}>Statistics</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-[16px] font-normal leading-[24px]" style={{ color: "var(--text-secondary)" }}>Total Topics</span>
                <span className="font-montserrat text-[16px] font-semibold leading-[24px]" style={{ color: "var(--text-primary)" }}>
                  {totalTopics.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-[16px] font-normal leading-[24px]" style={{ color: "var(--text-secondary)" }}>
                  Active Users
                </span>
                <span className="font-montserrat text-[16px] font-semibold leading-[24px]" style={{ color: "var(--text-primary)" }}>
                  {activeUsers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-[16px] font-normal leading-[24px]" style={{ color: "var(--text-secondary)" }}>New Today</span>
                <span className="font-montserrat text-[16px] font-semibold leading-[24px]" style={{ color: "var(--text-primary)" }}>{newToday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Topic Detail */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topic Header Card */}
          <div className="p-4 md:p-6 mb-4 md:mb-6" style={{ border: "1px solid var(--border-color)" }}>
            {/* Title */}
            <h2 className="font-montserrat text-[18px] md:text-[24px] font-bold leading-[26px] md:leading-[32px] mb-3 md:mb-4" style={{ color: "var(--text-primary)" }}>
              {post.title}
            </h2>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
              {post.isPinned && (
                <span className="font-montserrat text-[11px] md:text-[12px] font-medium px-2 md:px-3 py-1" style={{ color: "var(--error-color)", backgroundColor: "color-mix(in srgb, var(--error-color) 15%, transparent)" }}>
                  Pinned
                </span>
              )}
              {post.isLocked && (
                <span className="font-montserrat text-[11px] md:text-[12px] font-medium px-2 md:px-3 py-1" style={{ color: "var(--text-muted)", backgroundColor: "var(--surface-bg)" }}>
                  Locked
                </span>
              )}
              <span className="font-montserrat text-[11px] md:text-[12px] font-medium px-2 md:px-3 py-1" style={{ color: "var(--accent-color)", backgroundColor: "color-mix(in srgb, var(--accent-color) 15%, transparent)" }}>
                {post.ForumCategory.name}
              </span>
            </div>

            {/* Author Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 md:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden relative flex-shrink-0" style={{ backgroundColor: "var(--surface-bg)" }}>
                  {post.user.image ? (
                    <Image src={post.user.image} alt={post.user.name || ""} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-sm md:text-base" style={{ color: "var(--text-primary)" }}>
                      {(post.user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <Link
                  href={`/foro/perfil/${post.user.id}`}
                  className="font-montserrat text-[13px] md:text-[14px] font-normal leading-[20px] transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  By {post.user.name || "User"}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-[12px] md:text-[14px] font-montserrat flex-wrap" style={{ color: "var(--text-muted)" }}>
                <span className="hidden sm:inline">•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
                <span>•</span>
                <span>{post.viewCount} Views</span>
                <span>•</span>
                <span>{post.replyCount} replies</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-color)" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span className="font-montserrat text-[13px] md:text-[14px] font-normal leading-[20px]" style={{ color: "var(--text-primary)" }}>
                    {post.likeCount}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className="font-montserrat text-[13px] md:text-[14px] font-normal leading-[20px]" style={{ color: "var(--text-primary)" }}>
                    {post.replyCount}
                  </span>
                </div>
              </div>

              {!post.isLocked && (
                <button
                  className="flex items-center justify-center gap-2 px-4 py-2 font-montserrat text-[13px] md:text-[14px] font-medium w-full sm:w-auto"
                  style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}
                >
                  Reply
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6" style={{ backgroundColor: "var(--surface-bg)" }}>
            <div className="mb-4 md:mb-6">
              <div
                className="font-montserrat text-[14px] md:text-[16px] font-normal leading-[22px] md:leading-[24px] whitespace-pre-wrap break-words"
                style={{ color: "var(--text-primary)" }}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </div>

          {/* Poll */}
          {post.poll && (
            <div className="mt-4 md:mt-6">
              <PollWidget
                pollId={post.poll.id}
                question={post.poll.question}
                multiple={post.poll.multiple}
                endsAt={post.poll.endsAt ? post.poll.endsAt.toISOString() : null}
                options={post.poll.options.map((option) => ({
                  id: option.id,
                  text: option.text,
                  votes: option._count.votes,
                  votedByMe: option.votes.length > 0,
                }))}
                isLoggedIn={!!userId}
              />
            </div>
          )}

          {/* Replies Section */}
          <ForumReplies
            replies={post.ForumReply.map((reply) => ({
              id: reply.id,
              parentId: reply.parentId,
              author: reply.user.name || "User",
              authorId: reply.user.id,
              authorImage: reply.user.image,
              tier: reply.user.SubscriptionPlan?.name || "FREE",
              timeAgo: formatTimeAgo(reply.createdAt),
              content: reply.content,
              likeCount: reply.likeCount,
              isLiked: likedReplyIds.has(reply.id),
            }))}
            postId={post.id}
            postContent={post.content}
            postAuthor={post.user.name || "User"}
            postLikeCount={post.likeCount}
            isPostLiked={isPostLiked}
            isLocked={post.isLocked}
            userId={userId}
          />
        </div>
      </div>
    </div>
  )
}
