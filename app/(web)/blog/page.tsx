import Image from "next/image"
import Link from "next/link"
import { Heart, MessageCircle } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { BlogCategoryFilter } from "./blog-category-filter"
import { DiscountBanner } from "@/components/discount-banner"

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
    return new Date(date).toLocaleDateString("es-ES", {
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
    return `${minutes} min lectura`
  }

  return (
    <main className="bg-black flex-1 pt-[120px]">
      {/* Discount Banner */}
      <div className="mt-[17px]">
        <DiscountBanner />
      </div>

      {/* Hero Banner */}
      <div className="pt-8 px-4 md:px-8">
        <h1 className="text-white font-['Montserrat'] text-4xl font-bold mb-8">Blog</h1>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* LEFT COLUMN - Blog Posts */}
          <div>
            {/* Hero Featured Post */}
            {featuredPost && (
              <Link href={`/blog/${featuredPost.slug}`}>
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
                      <span className="inline-block bg-[#FEE2E2] text-[#DC2626] text-sm font-medium px-3 py-1 font-['Montserrat']">
                        Destacado
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-400 rounded-full overflow-hidden relative">
                          {featuredPost.user.image && (
                            <Image
                              src={featuredPost.user.image}
                              alt={featuredPost.user.name || ""}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium font-['Montserrat']">
                            {featuredPost.user.name}
                          </div>
                          <div className="text-white text-xs font-['Montserrat']">
                            {featuredPost.publishedAt && formatDate(featuredPost.publishedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-white" />
                          <span className="text-white text-sm font-['Montserrat']">{featuredPost.likeCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 text-white" />
                          <span className="text-white text-sm font-['Montserrat']">0</span>
                        </div>
                      </div>
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
                  <p className="text-white/60 font-['Montserrat']">No hay artículos en esta categoría.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <article className="bg-[rgba(0,0,0,0)] overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-all group cursor-pointer">
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
                              <span className="bg-[#DCFCE7] text-[#16A34A] px-3 py-1 text-sm font-medium font-['Montserrat']">
                                {post.BlogCategory.name}
                              </span>
                            )}
                            <span className="text-[#9CA3AF] text-sm font-['Montserrat']">
                              {post.publishedAt && formatDate(post.publishedAt)}
                            </span>
                          </div>

                          {/* Title */}
                          <h2 className="text-white font-['Montserrat'] text-xl font-semibold leading-7 mb-3 line-clamp-2 group-hover:text-[#06B6D4] transition-colors">
                            {post.title}
                          </h2>

                          {/* Description */}
                          {post.excerpt && (
                            <p className="text-[#9CA3AF] text-sm font-['Montserrat'] mb-4 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                        </div>

                        {/* Author and Stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 overflow-hidden relative rounded-full bg-gray-600">
                              {post.user.image && (
                                <Image
                                  src={post.user.image}
                                  alt={post.user.name || ""}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <span className="text-white text-sm font-medium font-['Montserrat']">
                              {post.user.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-white">
                              <Heart className="w-4 h-4" />
                              <span className="text-sm font-['Montserrat']">{post.likeCount}</span>
                            </div>
                            <div className="flex items-center gap-1 text-white">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm font-['Montserrat']">0</span>
                            </div>
                          </div>
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
                    href={`/blog?${categorySlug ? `categoria=${categorySlug}&` : ""}page=${currentPage - 1}`}
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
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
                      href={`/blog?${categorySlug ? `categoria=${categorySlug}&` : ""}page=${pageNum}`}
                      className={`w-10 h-10 flex items-center justify-center font-['Montserrat'] font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-[#06B6D4] text-white"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="text-white font-['Montserrat']">...</span>
                )}

                {currentPage < totalPages && (
                  <Link
                    href={`/blog?${categorySlug ? `categoria=${categorySlug}&` : ""}page=${currentPage + 1}`}
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
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
            <div className="bg-[rgba(107,114,128,0.15)] p-6">
              <h3 className="text-white font-['Montserrat'] text-xl font-bold leading-7 mb-2">Mantente Actualizado</h3>
              <p className="text-[#DBEAFE] font-['Montserrat'] text-sm font-normal leading-5 mb-4">
                Recibe las últimas novedades en tu correo semanalmente
              </p>
              <input
                type="email"
                placeholder="Tu email"
                className="w-full bg-white border-0 text-[#ADAEBC] font-['Montserrat'] text-base px-4 py-2 mb-3 placeholder:text-[#ADAEBC]"
              />
              <button className="w-full btn-primary">
                Suscribirse
              </button>
            </div>

            {/* Popular This Week */}
            <div className="bg-black border border-[#E5E7EB] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-[25px]">
              <h3 className="text-white text-lg font-bold mb-4">Popular Esta Semana</h3>
              <div className="space-y-4">
                {popularPosts.map((post, index) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="flex gap-3 group">
                    <span className="text-white text-2xl font-bold leading-8">{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium leading-5 mb-1 group-hover:text-[#06B6D4] transition-colors line-clamp-2">
                        {post.title}
                      </p>
                      <p className="text-[#6B7280] text-xs leading-4">{post.viewCount.toLocaleString()} vistas</p>
                    </div>
                  </Link>
                ))}
                {popularPosts.length === 0 && (
                  <p className="text-[#6B7280] text-sm">No hay artículos populares aún.</p>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-black border border-[#E5E7EB] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-[25px]">
              <h3 className="text-white text-lg font-bold mb-4">Categorías</h3>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/blog?categoria=${cat.slug}`}
                    className="flex justify-between items-center hover:text-[#06B6D4] transition-colors"
                  >
                    <span className="text-white text-base leading-6">{cat.name}</span>
                    <span className="text-white font-['Inter'] text-sm leading-5">{cat._count.BlogPost}</span>
                  </Link>
                ))}
                {categories.length === 0 && <p className="text-[#6B7280] text-sm">No hay categorías.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
