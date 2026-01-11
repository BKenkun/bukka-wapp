import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ForumTopicCard } from "@/components/forum-topic-card"
import { ForumSortSelect } from "./forum-sort-select"

interface ForoPageProps {
  searchParams: Promise<{ categoria?: string; page?: string; orden?: string }>
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

export default async function ForoPage({ searchParams }: ForoPageProps) {
  const params = await searchParams
  const categorySlug = params.categoria
  const currentPage = Math.max(1, parseInt(params.page || "1"))
  const sortOrder = params.orden || "recent"
  const pageSize = 10

  // Build where clause
  const whereClause: Record<string, unknown> = {}

  if (categorySlug) {
    whereClause.category = { slug: categorySlug }
  }

  // Determine sort order
  let orderBy: Record<string, string>[]
  switch (sortOrder) {
    case "popular":
      orderBy = [{ isPinned: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }]
      break
    case "replies":
      orderBy = [{ isPinned: "desc" }, { replyCount: "desc" }, { createdAt: "desc" }]
      break
    default:
      orderBy = [{ isPinned: "desc" }, { createdAt: "desc" }]
  }

  // Fetch data in parallel
  const [posts, totalCount, categories, stats, selectedCategory] = await Promise.all([
    prisma.forumPost.findMany({
      where: whereClause,
      orderBy,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, slug: true, name: true } },
      },
    }),
    prisma.forumPost.count({ where: whereClause }),
    prisma.forumCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { posts: true } },
      },
    }),
    Promise.all([
      prisma.forumPost.count(),
      prisma.user.count({ where: { forumPosts: { some: {} } } }),
      prisma.forumPost.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]),
    categorySlug
      ? prisma.forumCategory.findUnique({ where: { slug: categorySlug } })
      : null,
  ])

  const [totalTopics, activeUsers, newToday] = stats
  const totalPages = Math.ceil(totalCount / pageSize)

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
              <Link
                href="/foro"
                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                  !categorySlug ? "bg-[rgba(250,72,96,0.27)]" : "hover:bg-white/5"
                }`}
              >
                <span className="font-montserrat text-white text-[16px] font-medium leading-[24px]">
                  Todos
                </span>
                <span
                  className="font-montserrat text-[#111827] text-[12px] font-normal bg-white px-2 py-1 flex items-center justify-end"
                  style={{ padding: "4px 8px" }}
                >
                  {totalTopics}
                </span>
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/foro?categoria=${category.slug}`}
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                    categorySlug === category.slug ? "bg-[rgba(250,72,96,0.27)]" : "hover:bg-white/5"
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-white text-[20px] font-semibold leading-[28px]">
                {selectedCategory ? selectedCategory.name : "Temas"}
              </h1>
              <span className="w-2 h-2 rounded-full bg-[#FA4860]" />
              <span className="font-montserrat text-white text-[16px] font-normal leading-[24px]">
                {totalCount} temas
              </span>
            </div>

            {/* Controls */}
            <ForumSortSelect currentSort={sortOrder} categorySlug={categorySlug} />
          </div>

          {/* Forum Topics */}
          <div className="flex flex-col gap-4">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60 font-montserrat text-lg mb-4">No hay temas en esta categoría.</p>
                <Link
                  href="/foro/nuevo"
                  className="inline-flex items-center gap-2 bg-[#00B1DE] text-white px-6 py-3 font-montserrat"
                >
                  Crear el primer tema
                </Link>
              </div>
            ) : (
              posts.map((post, index) => (
                <ForumTopicCard
                  key={post.id}
                  id={post.id}
                  avatar={post.author.image}
                  tags={[
                    { label: post.category.name, variant: "orange" as const },
                  ]}
                  title={post.title}
                  description={post.content.length > 200 ? post.content.substring(0, 200) + "..." : post.content}
                  author={post.author.name || "Usuario"}
                  timeAgo={formatTimeAgo(post.createdAt)}
                  views={post.viewCount.toLocaleString()}
                  comments={post.replyCount}
                  likes={post.likeCount}
                  isPinned={post.isPinned}
                  hasNewActivity={
                    post.lastReplyAt
                      ? new Date(post.lastReplyAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                      : false
                  }
                  showHighlight={index === 0 && post.isPinned}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/foro?${categorySlug ? `categoria=${categorySlug}&` : ""}${sortOrder !== "recent" ? `orden=${sortOrder}&` : ""}page=${currentPage - 1}`}
                  className="bg-white/10 text-white px-4 py-2 font-montserrat text-[14px] font-medium hover:bg-white/20 transition-colors"
                >
                  ←
                </Link>
              )}

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Link
                    key={pageNum}
                    href={`/foro?${categorySlug ? `categoria=${categorySlug}&` : ""}${sortOrder !== "recent" ? `orden=${sortOrder}&` : ""}page=${pageNum}`}
                    className={`px-4 py-2 font-montserrat text-[14px] font-medium transition-colors ${
                      currentPage === pageNum
                        ? "bg-[#00B1DE] text-white"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              })}

              {currentPage < totalPages && (
                <Link
                  href={`/foro?${categorySlug ? `categoria=${categorySlug}&` : ""}${sortOrder !== "recent" ? `orden=${sortOrder}&` : ""}page=${currentPage + 1}`}
                  className="bg-white/10 text-white px-4 py-2 font-montserrat text-[14px] font-medium hover:bg-white/20 transition-colors"
                >
                  →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
