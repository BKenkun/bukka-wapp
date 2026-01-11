import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ForumReplies } from "./forum-replies"

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

  // Fetch post with author, category, and replies
  const [post, categories, stats] = await Promise.all([
    prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, image: true, tier: true } },
        category: { select: { id: true, slug: true, name: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, image: true, tier: true } },
          },
        },
      },
    }),
    prisma.forumCategory.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { posts: true } } },
    }),
    Promise.all([
      prisma.forumPost.count(),
      prisma.user.count({ where: { forumPosts: { some: {} } } }),
      prisma.forumPost.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]),
  ])

  if (!post) {
    notFound()
  }

  // Increment view count
  await prisma.forumPost.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })

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
      <div className="px-4 md:px-8 pt-8">
        <h1 className="font-montserrat text-white text-[30px] font-bold leading-[36px]">Foro</h1>
      </div>

      <div className="flex flex-1 px-4 md:px-8 py-12 gap-8">
        {/* Sidebar - Categories */}
        <div className="w-[280px] flex-shrink-0">
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
                    post.categoryId === category.id ? "bg-[rgba(250,72,96,0.27)]" : "hover:bg-white/5"
                  }`}
                >
                  <span className="font-montserrat text-white text-[16px] font-medium leading-[24px]">
                    {category.name}
                  </span>
                  <span
                    className="font-montserrat text-[#111827] text-[12px] font-normal bg-white px-2 py-1 flex items-center justify-end"
                    style={{ padding: "4px 8px" }}
                  >
                    {category._count.posts}
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
        <div className="flex-1 flex flex-col">
          {/* Topic Header Card */}
          <div className="border border-[#E5E7EB] p-6 mb-6">
            {/* Title */}
            <h2 className="font-montserrat text-white text-[24px] font-bold leading-[32px] mb-4">
              {post.title}
            </h2>

            {/* Tags */}
            <div className="flex items-center gap-2 mb-4">
              {post.isPinned && (
                <span className="font-montserrat text-[#DC2626] text-[12px] font-medium bg-[#FEE2E2] px-3 py-1">
                  Fijado
                </span>
              )}
              {post.isLocked && (
                <span className="font-montserrat text-[#6B7280] text-[12px] font-medium bg-[#E5E7EB] px-3 py-1">
                  Cerrado
                </span>
              )}
              <span className="font-montserrat text-[#1E40AF] text-[12px] font-medium bg-[#DBEAFE] px-3 py-1">
                {post.category.name}
              </span>
            </div>

            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gray-600">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt={post.author.name || ""}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {(post.author.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <Link
                href={`/foro/perfil/${post.author.id}`}
                className="font-montserrat text-white text-[14px] font-normal leading-[20px] hover:text-[#00B1DE] transition-colors"
              >
                Por {post.author.name || "Usuario"}
              </Link>
              <span className="font-montserrat text-white text-[14px] font-normal leading-[20px]">•</span>
              <span className="font-montserrat text-white text-[14px] font-normal leading-[20px]">
                {formatTimeAgo(post.createdAt)}
              </span>
              <span className="font-montserrat text-white text-[14px] font-normal leading-[20px]">•</span>
              <span className="font-montserrat text-white text-[14px] font-normal leading-[20px]">
                {post.viewCount} Vistas
              </span>
              <span className="font-montserrat text-white text-[14px] font-normal leading-[20px]">•</span>
              <span className="font-montserrat text-white text-[14px] font-normal leading-[20px]">
                {post.replyCount} respuestas
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
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
                  <span className="font-montserrat text-white text-[14px] font-normal leading-[20px]">
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
                  <span className="font-montserrat text-white text-[14px] font-normal leading-[20px]">
                    {post.replyCount}
                  </span>
                </div>

                {/* Share */}
                <div className="flex items-center gap-1 cursor-pointer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span className="font-montserrat text-white text-[14px] font-normal leading-[20px]">Compartir</span>
                </div>
              </div>

              {/* Responder Button */}
              {!post.isLocked && (
                <button className="flex items-center gap-2 bg-[#3B82F6] px-4 py-2 text-white font-montserrat text-[14px] font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  </svg>
                  Responder
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-[rgba(75,85,99,0.21)] p-6">
            {/* Post Content */}
            <div className="mb-6">
              <div
                className="font-montserrat text-white text-[16px] font-normal leading-[24px] whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-4">
              <div className="flex items-center gap-6">
                {/* Like */}
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4B5563"
                    strokeWidth="2"
                  >
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                  <span className="font-montserrat text-white text-[14px] font-normal">{post.likeCount}</span>
                </div>

                {/* Quote */}
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4B5563"
                    strokeWidth="2"
                  >
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"></path>
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"></path>
                  </svg>
                  <span className="font-montserrat text-white text-[14px] font-normal">Citar</span>
                </div>
              </div>

              {/* Report */}
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4B5563"
                  strokeWidth="2"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                <span className="font-montserrat text-white text-[14px] font-normal">Reportar</span>
              </div>
            </div>
          </div>

          {/* Replies Section */}
          <ForumReplies
            replies={post.replies.map((reply) => ({
              id: reply.id,
              author: reply.author.name || "Usuario",
              authorImage: reply.author.image,
              tier: reply.author.tier,
              timeAgo: formatTimeAgo(reply.createdAt),
              content: reply.content,
            }))}
            postId={post.id}
            isLocked={post.isLocked}
          />
        </div>
      </div>
    </div>
  )
}
