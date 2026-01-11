import { prisma } from "@/lib/prisma"
import { BlogForm } from "../blog-form"

export default async function NewBlogPostPage() {
  const categories = await prisma.blogCategory.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nuevo Artículo</h1>
        <p className="text-muted-foreground">Crea un nuevo artículo para el blog</p>
      </div>

      <div className="max-w-4xl">
        <BlogForm categories={categories} />
      </div>
    </div>
  )
}
