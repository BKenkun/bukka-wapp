import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BlogForm } from "../blog-form"

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params

  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
    }),
    prisma.blogCategory.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
  ])

  if (!post) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar Artículo</h1>
        <p className="text-muted-foreground">{post.title}</p>
      </div>

      <div className="max-w-4xl">
        <BlogForm post={post} categories={categories} />
      </div>
    </div>
  )
}
