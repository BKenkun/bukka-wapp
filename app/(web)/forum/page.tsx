import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getUserPlan, canUserAccessForum } from "@/lib/subscription-guard"
import { ForumTopicCard } from "@/components/forum-topic-card"
import { ForumSortSelect } from "./forum-sort-select"
import { ForumAccessDenied } from "./forum-access-denied"

interface ForoPageProps {
  searchParams: Promise<{ categoria?: string; page?: string; orden?: string }>
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

export default async function ForoPage({ searchParams }: ForoPageProps) {
  // Check forum access
  const session = await auth()
  const userPlan = session?.user?.id ? await getUserPlan(session.user.id) : null

  if (!canUserAccessForum(userPlan)) {
    return (
      <ForumAccessDenied
        isLoggedIn={!!session?.user}
        currentPlanName={userPlan?.name}
      />
    )
  }

  const params = await searchParams
  const categorySlug = params.categoria
  const currentPage = Math.max(1, parseInt(params.page || "1"))
  const sortOrder = params.orden || "recent"
  const pageSize = 10

  // Build where clause
  const whereClause: Record<string, unknown> = {}

  if (categorySlug) {
    whereClause.ForumCategory = { slug: categorySlug }
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
        user: { select: { id: true, name: true, image: true } },
        ForumCategory: { select: { id: true, slug: true, name: true } },
      },
    }),
    prisma.forumPost.count({ where: whereClause }),
    prisma.forumCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { ForumPost: true } },
      },
    }),
    Promise.all([
      prisma.forumPost.count(),
      prisma.user.count({ where: { ForumPost: { some: {} } } }),
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
    <div className="flex-1 flex flex-col font-sans" style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}>
      <div className="px-4 md:px-8 pt-24 md:pt-28">
        <h1 className="font-montserrat text-[24px] md:text-[30px] font-bold leading-[32px] md:leading-[36px]" style={{ color: "var(--text-primary)" }}>Forum</h1>
      </div>

      {/* Mobile: New Topic Button + Category Filter */}
      <div className="lg:hidden px-4 md:px-8 pt-6">
        <Link href="/forum/nuevo" className="block mb-4">
          <button className="w-full btn-primary flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M7.5 1C7.5 0.446875 7.05312 0 6.5 0C5.94688 0 5.5 0.446875 5.5 1V5.5H1C0.446875 5.5 0 5.94688 0 6.5C0 7.05312 0.446875 7.5 1 7.5H5.5V12C5.5 12.5531 5.94688 13 6.5 13C7.05312 13 7.5 12.5531 7.5 12V7.5H12C12.5531 7.5 13 7.05312 13 6.5C13 5.94688 12.5531 5.5 12 5.5H7.5V1Z"
                fill="currentColor"
              />
            </svg>
            New Topic
          </button>
        </Link>

        {/* Mobile Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            href="/forum"
            className="flex-shrink-0 px-4 py-2 font-montserrat text-[13px] font-medium transition-colors"
            style={{
              backgroundColor: !categorySlug ? "var(--brand-color)" : "var(--surface-bg)",
              color: "var(--text-primary)",
            }}
          >
            All ({totalTopics})
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/foro?categoria=${category.slug}`}
              className="flex-shrink-0 px-4 py-2 font-montserrat text-[13px] font-medium transition-colors"
              style={{
                backgroundColor: categorySlug === category.slug ? "var(--brand-color)" : "var(--surface-bg)",
                color: "var(--text-primary)",
              }}
            >
              {category.name} ({category._count.ForumPost})
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-1 px-4 md:px-8 py-6 lg:py-12 gap-8">
        {/* Sidebar - Categories (hidden on mobile) */}
        <div className="w-[280px] flex-shrink-0 hidden lg:block">
          <Link href="/forum/nuevo">
            <button
              className="w-full btn-primary mb-6 flex items-center justify-center gap-2"
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
              <Link
                href="/forum"
                className="flex items-center justify-between p-3 cursor-pointer transition-colors"
                style={{ backgroundColor: !categorySlug ? "color-mix(in srgb, var(--brand-color) 27%, transparent)" : "transparent" }}
              >
                <span className="font-montserrat text-[16px] font-medium leading-[24px]" style={{ color: "var(--text-primary)" }}>
                  All
                </span>
                <span
                  className="font-montserrat text-[12px] font-normal px-2 py-1 flex items-center justify-end"
                  style={{ padding: "4px 8px", backgroundColor: "var(--brand-color)", color: "#FFFFFF" }}
                >
                  {totalTopics}
                </span>
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/foro?categoria=${category.slug}`}
                  className="flex items-center justify-between p-3 cursor-pointer transition-colors"
                  style={{ backgroundColor: categorySlug === category.slug ? "color-mix(in srgb, var(--brand-color) 27%, transparent)" : "transparent" }}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div className="flex items-center gap-3 lg:gap-4">
              <h2 className="text-[18px] lg:text-[20px] font-semibold leading-[28px]" style={{ color: "var(--text-primary)" }}>
                {selectedCategory ? selectedCategory.name : "Topics"}
              </h2>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--brand-color)" }} />
              <span className="font-montserrat text-[14px] lg:text-[16px] font-normal leading-[24px]" style={{ color: "var(--text-secondary)" }}>
                {totalCount} topics
              </span>
            </div>

            {/* Controls */}
            <ForumSortSelect currentSort={sortOrder} categorySlug={categorySlug} />
          </div>

          {/* Forum Topics */}
          <div className="flex flex-col gap-4">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-montserrat text-lg mb-4" style={{ color: "var(--text-muted)" }}>No topics in this category.</p>
                <Link
                  href="/forum/nuevo"
                  className="inline-flex items-center gap-2 px-6 py-3 font-montserrat"
                  style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}
                >
                  Create the first topic
                </Link>
              </div>
            ) : (
              posts.map((post, index) => (
                <ForumTopicCard
                  key={post.id}
                  id={post.id}
                  avatar={post.user.image}
                  tags={[
                    { label: post.ForumCategory.name, variant: "orange" as const },
                  ]}
                  title={post.title}
                  description={post.content.length > 200 ? post.content.substring(0, 200) + "..." : post.content}
                  author={post.user.name || "User"}
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
                  className="px-4 py-2 font-montserrat text-[14px] font-medium transition-colors"
                  style={{ backgroundColor: "var(--surface-bg)", color: "var(--text-primary)" }}
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
                    className="px-4 py-2 font-montserrat text-[14px] font-medium transition-colors"
                    style={{
                      backgroundColor: currentPage === pageNum ? "var(--accent-color)" : "var(--surface-bg)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {pageNum}
                  </Link>
                )
              })}

              {currentPage < totalPages && (
                <Link
                  href={`/foro?${categorySlug ? `categoria=${categorySlug}&` : ""}${sortOrder !== "recent" ? `orden=${sortOrder}&` : ""}page=${currentPage + 1}`}
                  className="px-4 py-2 font-montserrat text-[14px] font-medium transition-colors"
                  style={{ backgroundColor: "var(--surface-bg)", color: "var(--text-primary)" }}
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
