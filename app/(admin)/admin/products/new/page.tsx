import { prisma } from "@/lib/prisma"
import { ProductForm } from "../product-form"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export default async function NewProductPage() {
  const [performers, categories, attributes] = await Promise.all([
    prisma.performer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, profileImage: true },
    }),
    prisma.shopCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.attribute.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: { id: true, value: true, slug: true, colorHex: true },
        },
      },
    }),
  ])

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/products">
            <IconArrowLeft className="mr-2 size-4" />
            Volver a Productos
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Nuevo Producto</h2>
        <p className="text-sm text-muted-foreground">
          Añade un nuevo producto a la tienda
        </p>
      </div>

      <ProductForm performers={performers} categories={categories} attributes={attributes} />
    </div>
  )
}
