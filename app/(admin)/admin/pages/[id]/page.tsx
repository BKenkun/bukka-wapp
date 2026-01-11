import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { PageForm } from "../page-form"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPagePage({ params }: Props) {
  const { id } = await params

  const page = await prisma.page.findUnique({
    where: { id },
  })

  if (!page) {
    notFound()
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/pages">
            <IconArrowLeft className="mr-2 size-4" />
            Volver a Páginas
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">Editar Página</h2>
        <p className="text-sm text-muted-foreground">
          {page.title}
        </p>
      </div>

      <PageForm page={page} />
    </div>
  )
}
