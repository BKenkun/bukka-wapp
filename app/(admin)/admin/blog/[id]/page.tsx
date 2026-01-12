import { prisma } from "@/lib/prisma"
import { BlogForm } from "../blog-form"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params

  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        featuredImage: true,
        categoryId: true,
        type: true,
        status: true,
      },
    }),
    prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  if (!post) {
    notFound()
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/blog">
            <IconArrowLeft className="mr-2 size-4" />
            Volver al Blog
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Editar Artículo</h2>
        <p className="text-muted-foreground">
          Modifica el artículo: {post.title}
        </p>
      </div>

      <BlogForm post={post} categories={categories} />
    </div>
  )
}
