import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getUserPlan, canUserAccessForum } from "@/lib/subscription-guard"
import { ForumReplies } from "./forum-replies"
import { ForumAccessDenied } from "../forum-access-denied"

interface ForoTopicPageProps {
  params: Promise<{ id: string }>
}

// Helper to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "hace unos segundos"
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`
  return `hace ${Math.floor(diffInSeconds / 604800)} semanas`
}

export async function generateMetadata({ params }: ForoTopicPageProps) {
  const { id } = await params
  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: { title: true, content: true },
  })

  if (!post) return { title: "Tema no encontrado" }

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

  // Helper for tier badge
  const getTierBadge = (tier: string) => {
    const badges: Record<string, { label: string; textColor: string; bgColor: string }> = {
      FREE: { label: "Free", textColor: "#6B7280", bgColor: "#E5E7EB" },
      SILVER: { label: "Silver", textColor: "#6B7280", bgColor: "#E5E7EB" },
      GOLD: { label: "Gold", textColor: "#854D0E", bgColor: "#FEF9C3" },
      PLATINUM: { label: "Platinum", textColor: "#6B7280", bgColor: "#E5E7EB" },
      DIAMOND: { label: "Diamond", textColor: "#1E40AF", bgColor: "#DBEAFE" },
    }
    return badges[tier] || badges.FREE
  }

  return (
    <div className="flex-1 flex flex-col font-sans bg-black text-white">
      <div className="px-4 md:px-8 pt-24 md:pt-28">
        <h1 className="font-montserrat text-white text-[24px] md:text-[30px] font-bold leading-[32px] md:leading-[36px]">Foro</h1>
      </div>

      {/* Mobile: Back Button */}
      <div className="lg:hidden px-4 md:px-8 pt-4">
        <Link
          href="/foro"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors font-montserrat text-sm"
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
          Volver al Foro
        </Link>
      </div>

      <div className="flex flex-1 px-4 md:px-8 py-6 lg:py-12 gap-8">
        {/* Sidebar - Categories (hidden on mobile) */}
        <div className="w-[280px] flex-shrink-0 hidden lg:block">
          <Link href="/foro/nuevo">
            <button
              className="w-full font-montserrat text-white text-[16px] font-medium text-center bg-[#00B1DE] mb-6 flex items-center justify-center gap-2"
              style={{ padding: "14px 52px" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M7.5 1C7.5 0.446875 7.05312 0 6.5 0C5.94688 0 5.5 0.446875 5.5 1V5.5H1C0.446875 5.5 0 5.94688 0 6.5C0 7.05312 0.446875 7.5 1 7.5H5.5V12C5.5 12.5531 5.94688 13 6.5 13C7.05312 13 7.5 12.5531 7.5 12V7.5H12C12.5531 7.5 13 7.05312 13 6.5C13 5.94688 12.5531 5.5 12 5.5H7.5V1Z"
                  fill="white"
                />
              </svg>
              Nuevo Tema
            </button>
          </Link>

          <div className="border border-[#E5E7EB] p-6">
            <h2 className="font-montserrat text-white text-[18px] font-semibold leading-normal mb-6">Categorías</h2>
            <div className="flex flex-col gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/foro?categoria=${category.slug}`}
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                    post.ForumCategory.id === category.id ? "bg-[rgba(250,72,96,0.27)]" : "hover:bg-white/5"
                  }`}
                >
                  <span className="font-montserrat text-white text-[16px] font-medium leading-[24px]">
                    {category.name}
                  </span>
                  <span
                    className="font-montserrat text-[#111827] text-[12px] font-normal bg-white px-2 py-1 flex items-center justify-end"
                    style={{ padding: "4px 8px" }}
                  >
                    {category._count.ForumPost}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="border border-[#E5E7EB] p-6 mt-6">
            <h2 className="font-montserrat text-white text-[18px] font-semibold leading-normal mb-6">Estadísticas</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-white text-[16px] font-normal leading-[24px]">Total Temas</span>
                <span className="font-montserrat text-white text-[16px] font-semibold leading-[24px]">
                  {totalTopics.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-white text-[16px] font-normal leading-[24px]">
                  Usuarios Activos
                </span>
                <span className="font-montserrat text-white text-[16px] font-semibold leading-[24px]">
                  {activeUsers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-white text-[16px] font-normal leading-[24px]">Nuevos Hoy</span>
                <span className="font-montserrat text-white text-[16px] font-semibold leading-[24px]">{newToday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Topic Detail */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topic Header Card */}
          <div className="border border-[#E5E7EB] p-4 md:p-6 mb-4 md:mb-6">
            {/* Title */}
            <h2 className="font-montserrat text-white text-[18px] md:text-[24px] font-bold leading-[26px] md:leading-[32px] mb-3 md:mb-4">
              {post.title}
            </h2>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
              {post.isPinned && (
                <span className="font-montserrat text-[#DC2626] text-[11px] md:text-[12px] font-medium bg-[#FEE2E2] px-2 md:px-3 py-1">
                  Fijado
                </span>
              )}
              {post.isLocked && (
                <span className="font-montserrat text-[#6B7280] text-[11px] md:text-[12px] font-medium bg-[#E5E7EB] px-2 md:px-3 py-1">
                  Cerrado
                </span>
              )}
              <span className="font-montserrat text-[#1E40AF] text-[11px] md:text-[12px] font-medium bg-[#DBEAFE] px-2 md:px-3 py-1">
                {post.ForumCategory.name}
              </span>
            </div>

            {/* Author Info - Mobile: Stack, Desktop: Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 md:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden relative bg-gray-600 flex-shrink-0">
                  {post.user.image ? (
                    <Image
                      src={post.user.image}
                      alt={post.user.name || ""}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                      {(post.user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <Link
                  href={`/foro/perfil/${post.user.id}`}
                  className="font-montserrat text-white text-[13px] md:text-[14px] font-normal leading-[20px] hover:text-[#00B1DE] transition-colors"
                >
                  Por {post.user.name || "Usuario"}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-[12px] md:text-[14px] font-montserrat flex-wrap">
                <span className="hidden sm:inline">•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
                <span>•</span>
                <span>{post.viewCount} Vistas</span>
                <span>•</span>
                <span>{post.replyCount} respuestas</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {/* Likes */}
                <div className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FA4860"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span className="font-montserrat text-white text-[13px] md:text-[14px] font-normal leading-[20px]">
                    {post.likeCount}
                  </span>
                </div>

                {/* Comments */}
                <div className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className="font-montserrat text-white text-[13px] md:text-[14px] font-normal leading-[20px]">
                    {post.replyCount}
                  </span>
                </div>

              </div>

              {/* Responder Button */}
              {!post.isLocked && (
                <button className="flex items-center justify-center gap-2 bg-[#3B82F6] px-4 py-2 text-white font-montserrat text-[13px] md:text-[14px] font-medium w-full sm:w-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  </svg>
                  Responder
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-[rgba(75,85,99,0.21)] p-4 md:p-6">
            {/* Post Content */}
            <div className="mb-4 md:mb-6">
              <div
                className="font-montserrat text-white text-[14px] md:text-[16px] font-normal leading-[22px] md:leading-[24px] whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

          </div>

          {/* Replies Section */}
          <ForumReplies
            replies={post.ForumReply.map((reply) => ({
              id: reply.id,
              parentId: reply.parentId,
              author: reply.user.name || "Usuario",
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
            postAuthor={post.user.name || "Usuario"}
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
