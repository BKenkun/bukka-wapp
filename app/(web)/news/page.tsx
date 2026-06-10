import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { BlogCategoryFilter } from "./blog-category-filter"
import { BlogNewsletterForm } from "./blog-newsletter-form"

interface BlogPageProps {
  searchParams: Promise<{ categoria?: string; page?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams
  const categorySlug = params.categoria
  const currentPage = Math.max(1, parseInt(params.page || "1"))
  const pageSize = 6

  // Build where clause
  const whereClause: Record<string, unknown> = {
    status: "PUBLISHED",
  }

  if (categorySlug) {
    whereClause.BlogCategory = { slug: categorySlug }
  }

  // Fetch data in parallel
  const [posts, totalCount, categories, featuredPost, popularPosts] = await Promise.all([
    prisma.blogPost.findMany({
      where: whereClause,
      orderBy: { publishedAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, image: true } },
        BlogCategory: { select: { id: true, slug: true, name: true } },
      },
    }),
    prisma.blogPost.count({ where: whereClause }),
    prisma.blogCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { BlogPost: { where: { status: "PUBLISHED" } } } },
      },
    }),
    // Get featured post (most recent with highest view count)
    prisma.blogPost.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      include: {
        user: { select: { id: true, name: true, image: true } },
        BlogCategory: { select: { id: true, slug: true, name: true } },
      },
    }),
    // Popular posts (for sidebar)
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 3,
      select: { id: true, title: true, slug: true, viewCount: true },
    }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Format date helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Calculate reading time
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return `${minutes} min read`
  }

  return (
    <main className="flex-1" style={{ backgroundColor: "var(--global-bg)" }}>
      {/* Hero Banner */}
      <div className="pt-8 px-4 md:px-8">
        <h1 className="font-['Montserrat'] text-4xl font-bold mb-8" style={{ color: "var(--text-primary)" }}>
          Blog
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* LEFT COLUMN - Blog Posts */}
          <div>
            {/* Hero Featured Post */}
            {featuredPost && (
              <Link href={`/news/${featuredPost.slug}`}>
                <div className="relative w-full h-[400px] overflow-hidden mb-8 group cursor-pointer">
                  <Image
                    src={featuredPost.featuredImage || "/placeholder-blog.jpg"}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="mb-4">
                      <span
                        className="inline-block text-sm font-medium px-3 py-1 font-['Montserrat']"
                        style={{ backgroundColor: "var(--brand-color)", color: "#ffffff" }}
                      >
                        Featured
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white text-sm mb-3 font-['Montserrat']">
                      {featuredPost.BlogCategory && <span>{featuredPost.BlogCategory.name}</span>}
                      <span>•</span>
                      <span>{getReadingTime(featuredPost.content)}</span>
                    </div>
                    <h2 className="text-white font-['Montserrat'] text-2xl font-bold leading-8 mb-3">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-white font-['Montserrat'] text-base leading-6 mb-4 line-clamp-2">
                        {featuredPost.excerpt}
                      </p>
                    )}
                    <div className="text-white text-sm font-['Montserrat']">
                      {featuredPost.publishedAt && formatDate(featuredPost.publishedAt)}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Category Filter Tabs */}
            <BlogCategoryFilter
              categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
              currentCategory={categorySlug}
            />

            {/* Blog Posts Grid */}
            <div className="space-y-6 mb-12">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-['Montserrat']" style={{ color: "var(--text-muted)" }}>
                    No articles in this category.
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <Link key={post.id} href={`/news/${post.slug}`}>
                    <article className="overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-all group cursor-pointer">
                      {/* Thumbnail */}
                      <div className="md:w-[250px] h-[200px] relative flex-shrink-0 overflow-hidden">
                        <Image
                          src={post.featuredImage || "/placeholder-blog.jpg"}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          {/* Category and Date */}
                          <div className="flex items-center gap-4 mb-3">
                            {post.BlogCategory && (
                              <span
                                className="px-3 py-1 text-sm font-medium font-['Montserrat']"
                                style={{
                                  backgroundColor: "color-mix(in srgb, var(--brand-color) 18%, transparent)",
                                  color: "var(--brand-color)",
                                }}
                              >
                                {post.BlogCategory.name}
                              </span>
                            )}
                            <span className="text-sm font-['Montserrat']" style={{ color: "var(--text-muted)" }}>
                              {post.publishedAt && formatDate(post.publishedAt)}
                            </span>
                          </div>

                          {/* Title */}
                          <h2
                            className="font-['Montserrat'] text-xl font-semibold leading-7 mb-3 line-clamp-2 transition-colors group-hover:!text-[var(--brand-color)]"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {post.title}
                          </h2>

                          {/* Description */}
                          {post.excerpt && (
                            <p className="text-sm font-['Montserrat'] mb-4 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                              {post.excerpt}
                            </p>
                          )}
                        </div>

                      </div>
                    </article>
                  </Link>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {currentPage > 1 && (
                  <Link
                    href={`/news?${categorySlug ? `categoria=${categorySlug}&` : ""}page=${currentPage - 1}`}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    style={{ color: "var(--text-primary)" }}
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
                      href={`/news?${categorySlug ? `categoria=${categorySlug}&` : ""}page=${pageNum}`}
                      className="w-10 h-10 flex items-center justify-center font-['Montserrat'] font-medium transition-colors hover:bg-white/10"
                      style={
                        currentPage === pageNum
                          ? { backgroundColor: "var(--brand-color)", color: "#ffffff" }
                          : { color: "var(--text-primary)" }
                      }
                    >
                      {pageNum}
                    </Link>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="font-['Montserrat']" style={{ color: "var(--text-primary)" }}>...</span>
                )}

                {currentPage < totalPages && (
                  <Link
                    href={`/news?${categorySlug ? `categoria=${categorySlug}&` : ""}page=${currentPage + 1}`}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Sidebar */}
          <aside className="space-y-[30px]">
            {/* Stay Updated Section */}
            <div className="p-6" style={{ backgroundColor: "color-mix(in srgb, var(--text-primary) 8%, transparent)" }}>
              <h3 className="font-['Montserrat'] text-xl font-bold leading-7 mb-2" style={{ color: "var(--text-primary)" }}>
                Stay Updated
              </h3>
              <p className="font-['Montserrat'] text-sm font-normal leading-5 mb-4" style={{ color: "var(--text-muted)" }}>
                Get the latest news in your inbox every week
              </p>
              <BlogNewsletterForm />
            </div>

            {/* Popular This Week */}
            <div
              className="shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-[25px]"
              style={{ backgroundColor: "var(--global-bg)", border: "1px solid var(--border-color)" }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                Popular This Week
              </h3>
              <div className="space-y-4">
                {popularPosts.map((post, index) => (
                  <Link key={post.id} href={`/news/${post.slug}`} className="flex gap-3 group">
                    <span className="text-2xl font-bold leading-8" style={{ color: "var(--text-primary)" }}>
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium leading-5 mb-1 transition-colors line-clamp-2 group-hover:!text-[var(--brand-color)]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {post.title}
                      </p>
                      <p className="text-xs leading-4" style={{ color: "var(--text-muted)" }}>
                        {post.viewCount.toLocaleString()} views
                      </p>
                    </div>
                  </Link>
                ))}
                {popularPosts.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No popular articles yet.</p>
                )}
              </div>
            </div>

            {/* Categories */}
            <div
              className="shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-[25px]"
              style={{ backgroundColor: "var(--global-bg)", border: "1px solid var(--border-color)" }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                Categories
              </h3>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/news?categoria=${cat.slug}`}
                    className="flex justify-between items-center transition-colors hover:opacity-80"
                  >
                    <span className="text-base leading-6" style={{ color: "var(--text-primary)" }}>{cat.name}</span>
                    <span className="font-['Inter'] text-sm leading-5" style={{ color: "var(--text-muted)" }}>
                      {cat._count.BlogPost}
                    </span>
                  </Link>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No categories.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
