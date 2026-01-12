import { prisma } from "@/lib/prisma"
import { BlogForm } from "../blog-form"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export default async function NewBlogPostPage() {
  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/blog">
            <IconArrowLeft className="mr-2 size-4" />
            Volver al Blog
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Nuevo Artículo</h2>
        <p className="text-muted-foreground">
          Crea un nuevo artículo para el blog
        </p>
      </div>

      <BlogForm categories={categories} />
    </div>
  )
}
