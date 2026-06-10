import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Heart, MessageCircle, Share2, ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, featuredImage: true },
  })

  if (!post) return { title: "Article not found" }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      user: { select: { id: true, name: true, image: true } },
      BlogCategory: { select: { id: true, slug: true, name: true } },
    },
  })

  if (!post) {
    notFound()
  }

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  })

  // Get related posts
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: post.id },
      OR: [
        { categoryId: post.categoryId },
        { authorId: post.authorId },
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    include: {
      user: { select: { name: true, image: true } },
      BlogCategory: { select: { name: true, slug: true } },
    },
  })

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
      {/* Back Button */}
      <div className="pt-[100px] px-4 md:px-8">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors font-['Montserrat'] text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article */}
      <article className="px-4 md:px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            {/* Category */}
            {post.BlogCategory && (
              <Link
                href={`/news?categoria=${post.BlogCategory.slug}`}
                className="inline-block px-3 py-1 text-sm font-medium font-['Montserrat'] mb-4 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: "color-mix(in srgb, var(--brand-color) 18%, transparent)", color: "var(--brand-color)" }}
              >
                {post.BlogCategory.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="font-['Montserrat'] text-3xl md:text-4xl font-bold leading-tight mb-6" style={{ color: "var(--text-primary)" }}>
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gray-600">
                  {post.user.image && (
                    <Image
                      src={post.user.image}
                      alt={post.user.name || ""}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <div className="text-white font-medium font-['Montserrat']">
                    {post.user.name}
                  </div>
                  <div className="text-white/60 text-sm font-['Montserrat']">
                    {post.publishedAt && formatDate(post.publishedAt)}
                  </div>
                </div>
              </div>
              <span className="text-white/40">•</span>
              <span className="text-white/60 text-sm font-['Montserrat']">
                {getReadingTime(post.content)}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-white/60 text-sm font-['Montserrat']">
                {post.viewCount.toLocaleString()} views
              </span>
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between border-t border-b border-white/10 py-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-white">
                  <Heart className="w-5 h-5" />
                  <span className="font-['Montserrat']">{post.likeCount}</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-['Montserrat']">0</span>
                </div>
              </div>
              <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="font-['Montserrat'] text-sm">Share</span>
              </button>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative w-full h-[400px] md:h-[500px] mb-8 overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none font-['Montserrat']
              prose-headings:font-['Montserrat'] prose-headings:font-bold
              prose-p:text-white/80 prose-p:leading-relaxed
              prose-a:text-[var(--brand-color)] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-blockquote:border-l-[var(--brand-color)] prose-blockquote:text-white/60
              prose-code:text-[var(--brand-color)] prose-code:bg-white/5 prose-code:px-1
              prose-pre:bg-white/5
            "
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.type && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <span className="inline-block text-white px-3 py-1 text-sm font-['Montserrat']" style={{ backgroundColor: "var(--brand-color)" }}>
                {post.type}
              </span>
            </div>
          )}
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="px-4 md:px-8 pb-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-['Montserrat'] text-2xl font-bold mb-8" style={{ color: "var(--text-primary)" }}>
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/news/${relatedPost.slug}`}
                  className="group"
                >
                  <article className="bg-[rgba(107,114,128,0.15)] overflow-hidden">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={relatedPost.featuredImage || "/placeholder-blog.jpg"}
                        alt={relatedPost.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      {relatedPost.BlogCategory && (
                        <span className="text-xs font-medium font-['Montserrat'] mb-2 block" style={{ color: "var(--brand-color)" }}>
                          {relatedPost.BlogCategory.name}
                        </span>
                      )}
                      <h3 className="text-white font-['Montserrat'] font-semibold line-clamp-2 group-hover:text-[var(--brand-color)] transition-colors">
                        {relatedPost.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-3 text-white/60 text-sm font-['Montserrat']">
                        <span>{relatedPost.user.name}</span>
                        <span>•</span>
                        <span>{relatedPost.publishedAt && formatDate(relatedPost.publishedAt)}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
